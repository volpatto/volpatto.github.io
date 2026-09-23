import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const severities = ["info", "low", "moderate", "high", "critical"];
const ghsaPattern = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;
export const AUDIT_TIMEOUT_MS = 45_000;
export const AUDIT_ARGS = Object.freeze([
  "audit",
  "--json",
  "--audit-level=info",
  // pnpm 11 treats --prod and --dev as exclusive selectors. Clearing both
  // selectors and `only` selects ALL dependencies in its config normalizer.
  "--no-production",
  "--no-dev",
  "--only=",
  "--optional",
  "--no-interactive",
  "--no-ignore-registry-errors",
  "--no-ignore-unfixable",
]);

const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nonempty = (value) =>
  typeof value === "string" && value.trim().length > 0;
const count = (value) => Number.isSafeInteger(value) && value >= 0;
const normalizeId = (value) => `GHSA-${value.slice(5).toLowerCase()}`;

function exactKeys(value, keys, label) {
  if (
    !object(value) ||
    Object.keys(value).length !== keys.length ||
    !keys.every((key) => Object.hasOwn(value, key))
  ) {
    throw new Error(`${label} must contain only ${keys.join(", ")}`);
  }
}

/** Shared with the policy loader; importing this module never runs pnpm. */
export function validateDependencyPolicy(value, { now = new Date() } = {}) {
  exactKeys(value, ["failOn", "exceptions"], "dependencies");
  if (
    !Array.isArray(value.failOn) ||
    new Set(value.failOn).size !== value.failOn.length ||
    !value.failOn.every((severity) => severities.includes(severity)) ||
    !["high", "critical"].every((severity) => value.failOn.includes(severity))
  ) {
    throw new Error(
      "dependencies.failOn must include high and critical and use unique known severities",
    );
  }
  if (!Array.isArray(value.exceptions)) {
    throw new Error("dependencies.exceptions must be a list");
  }
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new Error("Invalid audit date");
  }
  const today = now.toISOString().slice(0, 10);
  const ids = new Set();
  const exceptions = value.exceptions.map((exception) => {
    exactKeys(exception, ["id", "reason", "expires"], "dependency exception");
    if (typeof exception.id !== "string" || !ghsaPattern.test(exception.id)) {
      throw new Error(
        "Dependency exception id must be a complete GHSA identifier",
      );
    }
    const id = normalizeId(exception.id);
    if (ids.has(id)) throw new Error(`Duplicate dependency exception: ${id}`);
    ids.add(id);
    if (!nonempty(exception.reason)) {
      throw new Error(`Dependency exception ${id} requires a review reason`);
    }
    const expires = exception.expires;
    const date = new Date(`${expires}T00:00:00Z`);
    if (
      typeof expires !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(expires) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== expires
    ) {
      throw new Error(
        `Dependency exception ${id} requires a valid YYYY-MM-DD expiry`,
      );
    }
    // An exception is valid through its stated date, in UTC.
    if (expires < today)
      throw new Error(`Expired dependency exception: ${id} (${expires})`);
    return { id, reason: exception.reason.trim(), expires };
  });
  return { failOn: [...value.failOn], exceptions };
}

/** Validate pnpm 11's complete JSON report, not merely a zero exit status. */
export function parseAuditReport(stdout) {
  if (typeof stdout !== "string" || !stdout.trim())
    throw new Error("pnpm returned an empty audit report");
  const report = JSON.parse(stdout);
  if (
    !object(report) ||
    Object.hasOwn(report, "error") ||
    !object(report.advisories) ||
    !object(report.metadata)
  ) {
    throw new Error(
      "Unexpected pnpm audit JSON: advisories and metadata are required",
    );
  }
  const metadata = report.metadata;
  exactKeys(metadata.vulnerabilities, severities, "metadata.vulnerabilities");
  if (
    !severities.every((severity) => count(metadata.vulnerabilities[severity]))
  ) {
    throw new Error("Invalid vulnerability counts in pnpm audit metadata");
  }
  const dependencyCounts = [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "totalDependencies",
  ];
  if (
    !dependencyCounts.every((key) => count(metadata[key])) ||
    metadata.totalDependencies === 0 ||
    metadata.totalDependencies !==
      metadata.dependencies +
        metadata.devDependencies +
        metadata.optionalDependencies
  ) {
    throw new Error(
      "Invalid or empty dependency inventory in pnpm audit metadata",
    );
  }
  const found = Object.fromEntries(severities.map((severity) => [severity, 0]));
  for (const [key, advisory] of Object.entries(report.advisories)) {
    if (
      !object(advisory) ||
      !Number.isSafeInteger(advisory.id) ||
      advisory.id < 1 ||
      String(advisory.id) !== key ||
      !nonempty(advisory.module_name) ||
      !nonempty(advisory.vulnerable_versions) ||
      typeof advisory.title !== "string" ||
      typeof advisory.url !== "string" ||
      !severities.includes(advisory.severity) ||
      typeof advisory.github_advisory_id !== "string" ||
      (advisory.github_advisory_id !== "" &&
        !ghsaPattern.test(advisory.github_advisory_id)) ||
      !Array.isArray(advisory.findings) ||
      advisory.findings.length === 0 ||
      !advisory.findings.every(
        (finding) =>
          object(finding) &&
          nonempty(finding.version) &&
          Array.isArray(finding.paths) &&
          finding.paths.length > 0 &&
          finding.paths.every(nonempty) &&
          ["dev", "optional", "bundled"].every(
            (field) => typeof finding[field] === "boolean",
          ),
      )
    ) {
      throw new Error(`Malformed pnpm advisory: ${key}`);
    }
    found[advisory.severity]++;
  }
  if (
    severities.some(
      (severity) => found[severity] !== metadata.vulnerabilities[severity],
    )
  ) {
    throw new Error(
      "Incomplete pnpm audit report: advisory counts disagree with metadata; remove pnpm audit ignores and use reviewed policy exceptions instead",
    );
  }
  return report;
}

function failure(report, code, message, details = {}) {
  return {
    ...report,
    status: "error",
    exitCode: 2,
    error: { code, message, ...details },
  };
}

/** The injected runner allows offline tests using real pnpm-shaped responses. */
export function auditDependencies({
  policy,
  now = new Date(),
  cwd = process.cwd(),
  runner = spawnSync,
  command = "pnpm",
  prefixArgs = [],
} = {}) {
  const report = {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    tool: "pnpm audit",
    includes: ["production", "development", "optional"],
    status: "error",
    exitCode: 2,
    vulnerabilities: [],
  };
  try {
    report.policy = validateDependencyPolicy(policy, { now });
  } catch (error) {
    return failure(report, "invalid-policy", error.message);
  }
  let result;
  try {
    result = runner(command, [...prefixArgs, ...AUDIT_ARGS], {
      cwd,
      encoding: "utf8",
      timeout: AUDIT_TIMEOUT_MS,
      killSignal: "SIGKILL",
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
      shell: false,
    });
  } catch (error) {
    return failure(report, "process-error", error.message);
  }
  report.pnpmExitCode = result.status ?? null;
  if (result.error || result.signal || ![0, 1].includes(result.status)) {
    return failure(
      report,
      result.error?.code === "ETIMEDOUT" ? "timeout" : "process-error",
      result.error?.message ??
        `pnpm audit ended with status ${result.status}, signal ${result.signal ?? "none"}`,
      { stderr: String(result.stderr ?? "").slice(0, 8192) },
    );
  }
  let parsed;
  try {
    parsed = parseAuditReport(result.stdout);
  } catch (error) {
    return failure(report, "invalid-report", error.message, {
      stdout: String(result.stdout ?? "").slice(0, 8192),
      stderr: String(result.stderr ?? "").slice(0, 8192),
    });
  }
  report.pnpmReport = parsed;
  const advisories = Object.values(parsed.advisories);
  if (result.status !== (advisories.length > 0 ? 1 : 0)) {
    return failure(
      report,
      "inconsistent-exit",
      "pnpm exit status disagrees with the complete audit report",
    );
  }
  const used = new Set();
  report.vulnerabilities = advisories.map((advisory) => {
    const id = advisory.github_advisory_id || null;
    const exception =
      report.policy.exceptions.find((entry) => entry.id === id) ?? null;
    if (exception) used.add(exception.id);
    return {
      id,
      pnpmId: advisory.id,
      package: advisory.module_name,
      severity: advisory.severity,
      title: advisory.title,
      url: advisory.url,
      vulnerableVersions: advisory.vulnerable_versions,
      patchedVersions: advisory.patched_versions ?? null,
      findings: advisory.findings,
      exception,
      blocking:
        report.policy.failOn.includes(advisory.severity) && exception === null,
    };
  });
  report.unusedExceptions = report.policy.exceptions.filter(
    (entry) => !used.has(entry.id),
  );
  report.blockingCount = report.vulnerabilities.filter(
    (entry) => entry.blocking,
  ).length;
  report.status = report.blockingCount ? "blocked" : "passed";
  report.exitCode = report.blockingCount ? 1 : 0;
  return report;
}

export async function writeDependencyReport(path, report) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  const path = resolve(".test-output/security/dependencies.json");
  let report;
  try {
    if (process.argv.length !== 2)
      throw new Error("Usage: node scripts/audit-dependencies.mjs");
    const { loadSecurityPolicy } = await import("./security-policy.mjs");
    const policy = await loadSecurityPolicy();
    // pnpm sets npm_execpath when running package scripts. Using its JS entry
    // point with Node avoids platform-specific .cmd wrappers on Windows.
    const entry = process.env.npm_execpath;
    const viaNode = entry && /(?:^|[/\\])pnpm\.(?:c|m)?js$/.test(entry);
    report = auditDependencies({
      policy: policy.dependencies,
      ...(viaNode ? { command: process.execPath, prefixArgs: [entry] } : {}),
    });
  } catch (error) {
    report = failure(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        tool: "pnpm audit",
        vulnerabilities: [],
      },
      "configuration-error",
      error.message,
    );
  }
  try {
    await writeDependencyReport(path, report);
    if (report.status === "error")
      console.error(
        `Dependency audit failed: ${report.error.message}. Report: ${path}`,
      );
    else
      console.log(
        `Dependency audit ${report.status}: ${report.vulnerabilities.length} known advisories, ${report.blockingCount} blocking. Report: ${path}`,
      );
    process.exitCode = report.exitCode;
  } catch (error) {
    console.error(`Could not write dependency audit report: ${error.message}`);
    process.exitCode = 2;
  }
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  // Let this module finish loading before the loader imports its validator.
  void main();
}
