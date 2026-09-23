import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUDIT_ARGS,
  AUDIT_TIMEOUT_MS,
  auditDependencies,
  parseAuditReport,
  validateDependencyPolicy,
  writeDependencyReport,
} from "../scripts/audit-dependencies.mjs";

const now = new Date("2026-09-23T12:00:00Z");
const policy = { failOn: ["high", "critical"], exceptions: [] };
const ghsa = "GHSA-2345-6789-cfgh";
const exception = {
  id: ghsa,
  reason: "Reviewed: affected API is not used by the build",
  expires: "2026-10-01",
};

// pnpm 11.19.0's actual advisories/metadata schema, including dev/build findings.
function auditReport(advisories = []) {
  const vulnerabilities = {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
  };
  for (const advisory of advisories) vulnerabilities[advisory.severity]++;
  return {
    advisories: Object.fromEntries(
      advisories.map((advisory) => [String(advisory.id), advisory]),
    ),
    metadata: {
      vulnerabilities,
      dependencies: 231,
      devDependencies: 4,
      optionalDependencies: 112,
      totalDependencies: 347,
    },
  };
}

function advisory(severity = "high", id = 100001) {
  return {
    findings: [
      {
        version: "1.0.0",
        paths: [".>build-tool>affected-package"],
        dev: true,
        optional: false,
        bundled: false,
      },
    ],
    id,
    title: "Known vulnerability in a build dependency",
    module_name: "affected-package",
    vulnerable_versions: "<1.0.1",
    patched_versions: ">=1.0.1",
    severity,
    cwe: "CWE-79",
    github_advisory_id: ghsa,
    url: `https://github.com/advisories/${ghsa}`,
  };
}

function run(response = auditReport(), overrides = {}, options = {}) {
  return auditDependencies({
    now,
    policy,
    ...options,
    runner: () => ({
      status: Object.keys(response.advisories ?? {}).length ? 1 : 0,
      stdout: JSON.stringify(response),
      stderr: "",
      ...overrides,
    }),
  });
}

test("complete zero-advisory response passes and retains the dependency inventory", () => {
  const report = run();
  assert.equal(report.status, "passed");
  assert.equal(report.exitCode, 0);
  assert.deepEqual(report.vulnerabilities, []);
  assert.equal(report.pnpmReport.metadata.totalDependencies, 347);
  assert.deepEqual(report.includes, ["production", "development", "optional"]);
});

test("high/critical build dependencies block; lower severities remain visible", () => {
  for (const severity of ["info", "low", "moderate", "high", "critical"]) {
    const report = run(auditReport([advisory(severity)]));
    const blocking = ["high", "critical"].includes(severity);
    assert.equal(report.status, blocking ? "blocked" : "passed");
    assert.equal(report.exitCode, blocking ? 1 : 0);
    assert.equal(report.vulnerabilities[0].severity, severity);
    assert.equal(report.vulnerabilities[0].findings[0].dev, true);
    assert.equal(report.vulnerabilities[0].blocking, blocking);
    assert.equal(
      report.pnpmExitCode,
      1,
      "nonblocking pnpm findings still exit 1",
    );
  }
});

test("reviewed GHSA exceptions retain evidence and do not excuse other advisories", () => {
  const other = {
    ...advisory("critical", 100002),
    github_advisory_id: "GHSA-cfgh-jmpq-rvwx",
  };
  const report = run(
    auditReport([advisory(), other]),
    {},
    { policy: { ...policy, exceptions: [exception] } },
  );
  assert.equal(report.status, "blocked");
  assert.equal(report.blockingCount, 1);
  assert.deepEqual(report.vulnerabilities[0].exception, exception);
  assert.equal(report.vulnerabilities[0].blocking, false);
  assert.equal(report.vulnerabilities[1].blocking, true);
  const excepted = run(
    auditReport([advisory()]),
    {},
    { policy: { ...policy, exceptions: [exception] } },
  );
  assert.equal(excepted.status, "passed");
  assert.equal(excepted.vulnerabilities.length, 1);
});

test("unused exceptions are reported and a missing GHSA cannot silently bypass a gate", () => {
  const report = run(
    auditReport([{ ...advisory(), github_advisory_id: "" }]),
    {},
    { policy: { ...policy, exceptions: [exception] } },
  );
  assert.equal(report.status, "blocked");
  assert.deepEqual(report.unusedExceptions, [exception]);
  assert.equal(report.vulnerabilities[0].id, null);
});

test("policy rejects weakening, unknown fields/severities and invalid exception records", () => {
  const invalid = [
    {},
    { ...policy, ignore: [ghsa] },
    { ...policy, failOn: [] },
    { ...policy, failOn: ["critical"] },
    { ...policy, failOn: ["high", "critical", "severe"] },
    { ...policy, failOn: ["high", "critical", "high"] },
    { ...policy, exceptions: {} },
    ...[
      { ...exception, id: "*" },
      { ...exception, id: "CVE-2026-1234" },
      { ...exception, reason: "  " },
      { ...exception, expires: "2026-02-30" },
      { ...exception, expires: "2026-10-01T00:00:00Z" },
      { ...exception, expires: "2026-09-22" },
      { ...exception, ignore: true },
    ].map((entry) => ({ ...policy, exceptions: [entry] })),
    { ...policy, exceptions: [exception, exception] },
  ];
  for (const input of invalid) {
    assert.throws(() => validateDependencyPolicy(input, { now }));
    let calls = 0;
    const result = auditDependencies({
      policy: input,
      now,
      runner: () => {
        calls++;
      },
    });
    assert.equal(result.status, "error");
    assert.equal(result.error.code, "invalid-policy");
    assert.equal(calls, 0, "invalid policy must stop before the subprocess");
  }
});

test("expiry is inclusive through the indicated UTC date", () => {
  const input = {
    ...policy,
    exceptions: [{ ...exception, expires: "2026-09-23" }],
  };
  assert.doesNotThrow(() =>
    validateDependencyPolicy(input, { now: new Date("2026-09-23T23:59:59Z") }),
  );
  assert.throws(
    () =>
      validateDependencyPolicy(input, {
        now: new Date("2026-09-24T00:00:00Z"),
      }),
    /Expired/,
  );
});

test("empty, malformed, server-error and incomplete JSON all fail closed", () => {
  for (const stdout of [
    "",
    " ",
    "not JSON",
    "{}",
    "[]",
    "null",
    JSON.stringify({
      error: {
        code: "ERR_PNPM_AUDIT_BAD_RESPONSE",
        message: "Service unavailable",
      },
    }),
  ]) {
    const report = run(auditReport(), { stdout });
    assert.equal(report.status, "error");
    assert.equal(report.exitCode, 2);
    assert.equal(report.error.code, "invalid-report");
  }
  const masked = auditReport([advisory()]);
  masked.advisories = {};
  assert.throws(() => parseAuditReport(JSON.stringify(masked)), /disagree/);
  const missing = auditReport();
  delete missing.metadata.vulnerabilities.info;
  assert.throws(
    () => parseAuditReport(JSON.stringify(missing)),
    /metadata.vulnerabilities/,
  );
  const emptyInventory = auditReport();
  Object.keys(emptyInventory.metadata)
    .filter((key) => key !== "vulnerabilities")
    .forEach((key) => {
      emptyInventory.metadata[key] = 0;
    });
  assert.throws(
    () => parseAuditReport(JSON.stringify(emptyInventory)),
    /empty dependency inventory/,
  );
});

test("malformed individual advisories and inconsistent counts cannot be dropped", () => {
  for (const broken of [
    { ...advisory(), severity: "unknown" },
    { ...advisory(), github_advisory_id: "*" },
    { ...advisory(), findings: [] },
    { ...advisory(), findings: [{ version: "1.0.0", paths: [] }] },
    { ...advisory(), module_name: "" },
  ]) {
    const response = auditReport([advisory()]);
    response.advisories["100001"] = broken;
    assert.equal(run(response).error.code, "invalid-report");
  }
  const mismatch = auditReport([advisory()]);
  mismatch.metadata.vulnerabilities.high = 0;
  assert.equal(run(mismatch).error.code, "invalid-report");
});

test("nonzero operational exits, timeout, missing command, signal and overflow are errors", () => {
  for (const result of [
    { status: 2 },
    {
      status: null,
      error: Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }),
    },
    {
      status: null,
      error: Object.assign(new Error("pnpm not found"), { code: "ENOENT" }),
    },
    {
      status: null,
      error: Object.assign(new Error("output too large"), { code: "ENOBUFS" }),
    },
    { status: null, signal: "SIGTERM" },
  ]) {
    const report = run(auditReport(), result);
    assert.equal(report.status, "error");
    assert.equal(report.exitCode, 2);
    assert.equal(
      report.error.code,
      result.error?.code === "ETIMEDOUT" ? "timeout" : "process-error",
    );
  }
  assert.equal(
    run(auditReport(), { status: 1 }).error.code,
    "inconsistent-exit",
  );
  assert.equal(
    run(auditReport([advisory()]), { status: 0 }).error.code,
    "inconsistent-exit",
  );
  const thrown = auditDependencies({
    policy,
    now,
    runner: () => {
      throw new Error("runner failed");
    },
  });
  assert.equal(thrown.error.code, "process-error");
});

test("runner uses bounded, non-shell audit arguments without fix or ignore operations", () => {
  let called = false;
  const report = auditDependencies({
    policy,
    now,
    cwd: "/example",
    runner: (command, args, options) => {
      called = true;
      assert.equal(command, "pnpm");
      assert.deepEqual(args, AUDIT_ARGS);
      assert(args.includes("--audit-level=info"));
      for (const flag of [
        "--no-production",
        "--no-dev",
        "--only=",
        "--optional",
      ])
        assert(args.includes(flag));
      assert(!args.some((arg) => /^--(?:fix|ignore)(?:=|$)/.test(arg)));
      assert.equal(options.shell, false);
      assert.equal(options.timeout, AUDIT_TIMEOUT_MS);
      assert(options.timeout > 0 && options.timeout <= 60_000);
      assert.equal(options.killSignal, "SIGKILL");
      assert.equal(options.cwd, "/example");
      return { status: 0, stdout: JSON.stringify(auditReport()), stderr: "" };
    },
  });
  assert(called);
  assert.equal(report.status, "passed");
});

test("operational failures are written as JSON, not replaced by an empty success report", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dependency-audit-"));
  try {
    const report = run(auditReport(), { stdout: "Service unavailable" });
    const path = join(directory, "security", "dependencies.json");
    await writeDependencyReport(path, report);
    const saved = JSON.parse(await readFile(path, "utf8"));
    assert.equal(saved.status, "error");
    assert.equal(saved.error.code, "invalid-report");
    assert.equal(saved.exitCode, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI invoked through a symlink writes its report using an offline pnpm subprocess", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dependency-audit-cli-"));
  try {
    const script = join(directory, "audit-dependencies.mjs");
    await symlink(
      fileURLToPath(
        new URL("../scripts/audit-dependencies.mjs", import.meta.url),
      ),
      script,
      "file",
    );
    await writeFile(
      join(directory, "security-policy.yaml"),
      [
        "resources:",
        "  allowedOrigins: []",
        "dependencies:",
        "  failOn: [high, critical]",
        "  exceptions: []",
        "",
      ].join("\n"),
    );
    const pnpm = join(directory, "pnpm.cjs");
    const response = auditReport([advisory("low")]);
    await writeFile(
      pnpm,
      `
      if (JSON.stringify(process.argv.slice(2)) !== ${JSON.stringify(JSON.stringify(AUDIT_ARGS))}) process.exit(9);
      process.stdout.write(${JSON.stringify(JSON.stringify(response))});
      process.exitCode = 1;
    `,
    );
    const result = spawnSync(process.execPath, [script], {
      cwd: directory,
      env: { ...process.env, npm_execpath: pnpm },
      encoding: "utf8",
      timeout: 5000,
      killSignal: "SIGKILL",
      shell: false,
      windowsHide: true,
    });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(
      await readFile(
        join(directory, ".test-output/security/dependencies.json"),
        "utf8",
      ),
    );
    assert.equal(report.status, "passed");
    assert.equal(report.pnpmExitCode, 1);
    assert.equal(report.vulnerabilities.length, 1);
    assert.equal(report.vulnerabilities[0].severity, "low");
    assert.equal(report.vulnerabilities[0].package, "affected-package");
    assert.deepEqual(report.pnpmReport, response);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
