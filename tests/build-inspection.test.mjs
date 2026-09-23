import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { inspectBuild } from "../scripts/inspect-build.mjs";
import { parseSecurityPolicy } from "../scripts/security-policy.mjs";

const policy = {
  resources: { allowedOrigins: [] },
  dependencies: { failOn: ["high", "critical"], exceptions: [] },
};
async function inspect(t, files, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), "website-security-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const [file, source] of Object.entries(files)) {
    const path = join(directory, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, source);
  }
  return inspectBuild({
    directory,
    siteURL: "https://example.org",
    policy,
    ...options,
  });
}
const has = (report, rule) =>
  assert(
    report.issues.some((issue) => issue.rule === rule),
    `Expected ${rule}: ${JSON.stringify(report.issues)}`,
  );

test("artifact inspection permits local resources, PDFs and ordinary external links", async (t) => {
  const report = await inspect(
    t,
    {
      "index.html":
        '<link rel="stylesheet" href="/site/site.css"><img src="images/a.png"><a href="https://doi.org/10/example">Article</a><a href="mailto:author@example.org">Email</a><a href="/site/cv.pdf" download>CV</a><svg><use href="#symbol" /></svg>',
      "site.css":
        '@font-face {src:url("data:font/woff2;base64,dGVzdA==")} a{background: url(images/a.png)}',
      "images/a.png": "fixture",
      "cv.pdf": "%PDF-fixture",
      "logo.svg":
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
    },
    { base: "/site/" },
  );
  assert.equal(report.status, "passed", JSON.stringify(report.issues));
  assert.equal(report.htmlPages, 1);
  assert.deepEqual(report.externalLinks, [
    { url: "https://doi.org/10/example" },
  ]);
  assert(
    report.resources.some((resource) =>
      resource.url.endsWith("/site/images/a.png"),
    ),
  );
});

test("HTML checks catch unexpected active content, event handlers, downloads and encoded URLs", async (t) => {
  const report = await inspect(t, {
    "index.html": `<base href="https://other.invalid/"><form action="/"><input></form>
      <iframe srcdoc="anything"></iframe><meta HTTP-EQUIV="refresh" content="0;url=/elsewhere">
      <button ONCLICK="x()">x</button><a href="java&#x09;script:alert(1)">x</a>
      <a href="//other.invalid/installer.exe">x</a><a href="https://other.invalid/cv.pdf" download>x</a>
      <script src="//other.invalid/a.js"></script><img src="https://example.org@other.invalid/i.png">`,
  });
  for (const rule of [
    "active-element",
    "active-attribute",
    "redirect",
    "event-handler",
    "unsafe-url-scheme",
    "executable-link",
    "unexpected-download",
    "external-resource",
    "url-credentials",
  ])
    has(report, rule);
});

test("srcset candidates and SVG references are inspected independently of viewport", async (t) => {
  const report = await inspect(t, {
    "index.html":
      '<img srcset="data:image/png;base64,dGVzdA== 1x, https://bad.invalid/large.png 2x"><link rel="preload" as="image" imagesrcset="https://bad.invalid/preload.png 2x"><svg><image xlink:href="https://bad.invalid/embedded.png"/></svg>',
    "hidden.svg":
      '<?xml-stylesheet href="https://bad.invalid/a.css"?><svg xmlns="http://www.w3.org/2000/svg" xml:base="https://bad.invalid/"><foreignObject/><script>x()</script><set attributeName="href" to="https://bad.invalid/"/><image href="javascript:x()" onload="x()"/></svg>',
  });
  for (const path of ["large.png", "preload.png", "embedded.png"])
    assert(
      report.issues.some((issue) => issue.detail.endsWith(path)),
      path,
    );
  for (const rule of [
    "svg-processing",
    "active-element",
    "active-attribute",
    "event-handler",
    "unsafe-url-scheme",
  ])
    has(report, rule);
});

test("CSS imports, image-set, escaped URLs and unparsed content cannot bypass inspection", async (t) => {
  const report = await inspect(t, {
    "index.html":
      '<p style="background:url(//bad.invalid/inline.png)">x</p><style>@import "//bad.invalid/inline.css";</style>',
    "nested/site.css":
      '@import "https\\3a //bad.invalid/import.css"; a{background:url(https\\3a //bad.invalid/url.png);--image:url(//bad.invalid/custom.png);background:image-set("https://bad.invalid/set.png" 1x);cursor:u\\72l("https://bad.invalid/escaped.png");color:expression(alert(1));-moz-binding:url(//bad.invalid/binding.xml)}',
  });
  for (const path of [
    "inline.png",
    "inline.css",
    "import.css",
    "url.png",
    "custom.png",
    "set.png",
    "escaped.png",
    "binding.xml",
  ]) {
    assert(
      report.issues.some(
        (issue) =>
          issue.rule === "external-resource" && issue.detail.endsWith(path),
      ),
      path,
    );
  }
  has(report, "active-css");
  const invalid = await inspect(t, {
    "index.html": "<h1>x</h1>",
    "bad.css": "a{color:!!invalid}",
  });
  assert.equal(invalid.status, "failed");
});

test("XML namespace aliases cannot hide SVG code or external resources", async (t) => {
  const report = await inspect(t, {
    "index.html": "<h1>Fixture</h1>",
    "aliased.svg":
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg" xmlns:alt="http://www.w3.org/1999/xlink"><s:script>marker=1</s:script><image href="#local" alt:href="https://blocked.invalid/aliased.png"/><s:set attributeName="href" to="https://blocked.invalid/"/></svg>',
    "style.svg":
      '<svg xmlns="http://www.w3.org/2000/svg"><style><![CDATA[@import "https://blocked.invalid/inside-cdata.css";]]></style></svg>',
  });
  has(report, "active-element");
  assert(
    report.issues.some(
      (issue) =>
        issue.rule === "external-resource" &&
        issue.detail.endsWith("aliased.png"),
    ),
  );
  assert(
    report.issues.some(
      (issue) =>
        issue.rule === "external-resource" &&
        issue.detail.endsWith("inside-cdata.css"),
    ),
  );
});

test("approved PDF downloads must exist inside the deployment base", async (t) => {
  const report = await inspect(
    t,
    {
      "index.html":
        '<a download href="/site/missing.pdf">Missing</a><a download href="/outside/cv.pdf">Outside</a>',
    },
    { base: "/site/" },
  );
  has(report, "missing-resource");
  has(report, "resource-outside-base");
});

test("allowlist uses normalized exact origins and reports missing/escaping resources", async (t) => {
  const report = await inspect(
    t,
    {
      "index.html":
        '<img src="https://cdn.example.org/ok.png"><img src="https://cdn.example.org.bad.invalid/a.png"><img src="/wrong/a.png"><img src="/site/missing.png"><img src="/site/%2e%2e%2fsecret.png"><img src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E">',
    },
    {
      base: "/site/",
      policy: {
        ...policy,
        resources: { allowedOrigins: ["https://cdn.example.org"] },
      },
    },
  );
  assert(
    !report.issues.some(
      (issue) => issue.detail === "https://cdn.example.org/ok.png",
    ),
  );
  for (const rule of [
    "external-resource",
    "resource-outside-base",
    "missing-resource",
    "resource-outside-build",
    "unsafe-url-scheme",
  ])
    has(report, rule);
});

test("an absent/empty build cannot produce a successful inspection", async (t) => {
  await assert.rejects(
    () => inspect(t, { "only.css": "a{color:red}" }),
    /No generated HTML/,
  );
});

test("security YAML rejects misspelled fields, duplicate keys, wildcards and non-origin URLs", () => {
  const valid =
    "resources:\n  allowedOrigins: []\ndependencies:\n  failOn: [high, critical]\n  exceptions: []\n";
  assert.deepEqual(parseSecurityPolicy(valid), policy);
  assert.throws(
    () => parseSecurityPolicy(valid.replace("allowedOrigins", "allowedOrigin")),
    /Invalid security-policy/,
  );
  assert.throws(() => parseSecurityPolicy(valid + "resources: {}"), /unique/);
  for (const value of [
    "http://cdn.example.org",
    "https://*.example.org",
    "https://cdn.example.org/",
    "https://user@cdn.example.org",
    "https://cdn.example.org/script.js",
  ]) {
    assert.throws(
      () =>
        parseSecurityPolicy(
          valid.replace("allowedOrigins: []", `allowedOrigins: [\"${value}\"]`),
        ),
      /Invalid allowedOrigins/,
    );
  }
});
