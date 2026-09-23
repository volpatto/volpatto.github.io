import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { glob, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseDocument } from "htmlparser2";
import { secureHTML } from "../build/security.mjs";

const csp =
  "<meta http-equiv=\"content-security-policy\" content=\"default-src 'self'; script-src-elem 'self'; style-src-elem 'self'; script-src-attr 'none'\">";
const charset = '<meta charset="utf-8">';
const digest = (value) =>
  `sha256-${createHash("sha256").update(value).digest("base64")}`;
function* elements(node) {
  if (node.attribs) yield node;
  for (const child of node.children ?? []) yield* elements(child);
}

test("CSP precedes resources, preserves content and hashes exact inline text", () => {
  const script = 'window.example = "A &amp; B";\r\n// keep whitespace\r';
  const css = ':root { --color: "A &amp; B"; }\n';
  const comment = "<!-- <script>not executable</script> -->";
  const head = `${comment}${charset}<title>Ciência &amp; pesquisa</title><link rel="stylesheet" href="/site.css"><style>${css}</style><script>${script}</script>${csp}`;
  const html = `<!doctype html><html><head>${head}</head><body><p>Conteúdo preservado.</p></body></html>`;
  const result = secureHTML(html);
  assert(
    result.startsWith(
      `<!doctype html><html><head>${charset}<meta http-equiv="content-security-policy"`,
    ),
  );
  assert(result.includes(digest(script.replace(/\r\n?/g, "\n"))));
  assert(result.includes(digest(css)));
  assert(!result.includes(digest("not executable")));
  const withoutMeta = (value) => value.replace(/<meta\b[^>]*>/g, "");
  assert.equal(
    withoutMeta(result),
    withoutMeta(html),
    "only charset and CSP may change position/content",
  );
  assert.equal(secureHTML(result), result, "processing is idempotent");
});

test("CSP cannot be silently omitted, duplicated or weakened", () => {
  const wrap = (value) =>
    `<html><head>${charset}${value}</head><body></body></html>`;
  assert.throws(() => secureHTML(wrap("")), /exactly one CSP/);
  assert.throws(() => secureHTML(wrap(csp + csp)), /exactly one CSP/);
  assert.throws(() => secureHTML(wrap(charset + csp)), /exactly one charset/);
  assert.throws(
    () =>
      secureHTML(
        wrap(
          csp.replace(
            "default-src 'self'",
            "default-src 'self'; default-src *",
          ),
        ),
      ),
    /Duplicate CSP directive/,
  );
  assert.throws(
    () =>
      secureHTML(
        wrap(
          csp.replace(
            "script-src-elem 'self'",
            "script-src-elem 'unsafe-inline'",
          ),
        ),
      ),
    /Unsafe script policy/,
  );
  assert.throws(
    () =>
      secureHTML(
        wrap(csp.replace("style-src-elem 'self'", "style-src 'self'")),
      ),
    /Missing style-src-elem/,
  );
});

test("every generated HTML, including 404, enforces CSP before active content", async () => {
  const directory = resolve(process.env.BUILD_DIR ?? "dist");
  const pages = [];
  for await (const name of glob("**/*.html", { cwd: directory })) {
    pages.push(name);
    const html = await readFile(join(directory, name), "utf8");
    const nodes = [
      ...elements(parseDocument(html, { withStartIndices: true })),
    ];
    const policies = nodes.filter(
      (node) =>
        node.name === "meta" &&
        node.attribs["http-equiv"] === "content-security-policy",
    );
    assert.equal(policies.length, 1, name);
    const meta = policies[0];
    const policy = new Map(
      meta.attribs.content
        .split(";")
        .filter((part) => part.trim())
        .map((part) => {
          const [key, ...values] = part.trim().split(/\s+/);
          return [key, values];
        }),
    );
    for (const directive of [
      "base-uri",
      "form-action",
      "object-src",
      "frame-src",
      "worker-src",
      "connect-src",
      "script-src-attr",
    ]) {
      assert.deepEqual(
        policy.get(directive),
        ["'none'"],
        `${name}: ${directive}`,
      );
    }
    assert.deepEqual(policy.get("default-src"), ["'self'"]);
    assert.deepEqual(policy.get("script-src"), ["'self'"]);
    assert.deepEqual(policy.get("style-src-attr"), ["'unsafe-inline'"]);
    assert(html.indexOf(charset) < 1024, "encoding declared early");
    for (const node of nodes) {
      assert(
        !["iframe", "form", "object", "embed", "base"].includes(node.name),
        `${name}: unexpected ${node.name}`,
      );
      assert(
        !Object.keys(node.attribs).some((key) => key.startsWith("on")),
        `${name}: no HTML event handlers`,
      );
      if (["script", "style", "link"].includes(node.name))
        assert(
          node.startIndex > meta.startIndex,
          `${name}: ${node.name} before CSP`,
        );
      if (!["script", "style"].includes(node.name)) continue;
      const sources = policy.get(`${node.name}-src-elem`);
      assert(
        !sources.includes("'unsafe-inline'") &&
          !sources.includes("'unsafe-eval'"),
      );
      if (node.attribs.src) continue;
      const text = node.children
        .map((child) => child.data ?? "")
        .join("")
        .replace(/\r\n?/g, "\n");
      assert(
        sources.includes(`'${digest(text)}'`),
        `${name}: inline ${node.name} needs a matching hash`,
      );
    }
  }
  assert(pages.includes("404.html"));
  assert(pages.includes(join("pesquisa", "index.html")));
});
