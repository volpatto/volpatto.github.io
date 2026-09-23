import { createHash } from "node:crypto";
import { glob, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "htmlparser2";

function* elements(node) {
  if (node.attribs) yield node;
  for (const child of node.children ?? []) yield* elements(child);
}

// Astro's CSP does not hash SciAstro's is:inline theme/style blocks, and its
// meta appears after them. Complete the policy using trusted build output and
// place it before any resource. This does not protect a compromised build itself.
export function secureHTML(html) {
  const nodes = [
    ...elements(
      parseDocument(html, {
        withStartIndices: true,
        withEndIndices: true,
      }),
    ),
  ];
  const exactlyOne = (name, predicate) => {
    const matches = nodes.filter(predicate);
    if (matches.length !== 1) throw new Error(`Expected exactly one ${name}`);
    return matches[0];
  };
  const head = exactlyOne("head", (node) => node.name === "head");
  const charset = exactlyOne(
    "charset",
    (node) => node.name === "meta" && "charset" in node.attribs,
  );
  const meta = exactlyOne(
    "CSP meta",
    (node) =>
      node.name === "meta" &&
      node.attribs["http-equiv"]?.toLowerCase() === "content-security-policy",
  );
  if (charset.parent !== head || meta.parent !== head) {
    throw new Error("Charset and CSP must belong to head");
  }
  const directives = new Map();
  for (const entry of meta.attribs.content.split(";")) {
    const [name, ...values] = entry.trim().split(/\s+/);
    if (!name) continue;
    if (directives.has(name))
      throw new Error(`Duplicate CSP directive: ${name}`);
    directives.set(name, new Set(values));
  }
  for (const tag of ["script", "style"]) {
    const sources = directives.get(`${tag}-src-elem`);
    if (!sources) throw new Error(`Missing ${tag}-src-elem`);
    if (sources.has("'unsafe-inline'") || sources.has("'unsafe-eval'")) {
      throw new Error(`Unsafe ${tag} policy`);
    }
    for (const node of nodes.filter(
      (node) => node.name === tag && !("src" in node.attribs),
    )) {
      const content = node.children
        .map((child) => child.data ?? "")
        .join("")
        .replace(/\r\n?/g, "\n");
      const hash = createHash("sha256").update(content).digest("base64");
      sources.add(`'sha256-${hash}'`);
    }
  }
  const policy = [...directives]
    .map(([name, values]) => [name, ...values].join(" "))
    .join("; ");
  const escaped = policy.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const prefix = `${html.slice(charset.startIndex, charset.endIndex + 1)}<meta http-equiv="content-security-policy" content="${escaped}">`;
  // Remove only the two meta elements; keep every other byte unchanged.
  let result = html;
  for (const node of [charset, meta].sort(
    (a, b) => b.startIndex - a.startIndex,
  )) {
    result = result.slice(0, node.startIndex) + result.slice(node.endIndex + 1);
  }
  const start = head.children[0].startIndex;
  return result.slice(0, start) + prefix + result.slice(start);
}

export default function secureStaticHTML() {
  return {
    name: "website-security",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const directory = fileURLToPath(dir);
        let count = 0;
        for await (const name of glob("**/*.html", { cwd: directory })) {
          const path = join(directory, name);
          try {
            await writeFile(path, secureHTML(await readFile(path, "utf8")));
          } catch (error) {
            throw new Error(`Cannot secure ${name}: ${error.message}`, {
              cause: error,
            });
          }
          count++;
        }
        if (!count) throw new Error("No generated HTML pages found");
        logger.info(`Content Security Policy applied to ${count} pages.`);
      },
    },
  };
}
