import { readFile, readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { resolve, relative, dirname, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "htmlparser2";
import { realpathSync } from "node:fs";
import * as css from "css-tree";
import parseSrcset from "parse-srcset";
import { loadSecurityPolicy } from "./security-policy.mjs";

const forbiddenHTML = new Set([
  "base",
  "form",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "applet",
  "portal",
]);
const forbiddenSVG = new Set([
  "script",
  "foreignobject",
  "animate",
  "animatemotion",
  "animatetransform",
  "set",
  "discard",
]);
const resourceRelations = new Set([
  "stylesheet",
  "icon",
  "apple-touch-icon",
  "mask-icon",
  "preload",
  "modulepreload",
  "prefetch",
  "preconnect",
  "dns-prefetch",
  "prerender",
  "manifest",
]);
const executableFile =
  /\.(?:exe|msi|msix|bat|cmd|com|scr|ps1|sh|dmg|pkg|app|apk|jar)(?:$|\/)/i;
const passiveData =
  /^data:(?:image\/(?:png|jpeg|gif|webp|avif)|font\/(?:woff2?|ttf|otf)|application\/(?:font-woff|x-font-ttf|vnd\.ms-fontobject))(?:;|,)/i;

function* elements(node, inSVG = false) {
  const svg = inSVG || node.name?.toLowerCase() === "svg";
  if (node.attribs) yield { node, svg };
  for (const child of node.children ?? []) yield* elements(child, svg);
}

function textContent(node) {
  if (node.type === "text") return node.data;
  return (node.children ?? []).map(textContent).join("");
}

// This is a policy check of a trusted build, not a JavaScript malware detector.
// Resources are inventoried without contacting any external destination.
export async function inspectBuild({
  directory = "dist",
  siteURL,
  base = "/",
  policy,
}) {
  const root = resolve(directory);
  const origin = new URL(siteURL).origin;
  if (!base.startsWith("/") || !base.endsWith("/") || base.includes(".."))
    throw new Error("Invalid deployment base");
  const allowed = new Set([origin, ...policy.resources.allowedOrigins]);
  const report = {
    status: "passed",
    checkedFiles: 0,
    htmlPages: 0,
    resources: [],
    externalLinks: [],
    issues: [],
  };
  const issue = (file, rule, detail) =>
    report.issues.push({ file, rule, detail });
  const resources = new Map();
  const links = new Map();
  const slash = (path) => path.split(sep).join("/");
  const documentURL = (file) =>
    new URL(base + file.split("/").map(encodeURIComponent).join("/"), origin);

  function checkURL(
    raw,
    file,
    { resource = false, download = false, from = documentURL(file) } = {},
  ) {
    let url;
    try {
      url = new URL(raw, from);
    } catch {
      issue(file, "invalid-url", String(raw).slice(0, 120));
      return;
    }
    if (url.username || url.password)
      issue(file, "url-credentials", "URLs must not contain credentials");
    if (resource && url.protocol === "data:" && passiveData.test(raw)) return;
    if (!resource && !download && ["mailto:", "tel:"].includes(url.protocol))
      return;
    if (!["https:", "http:"].includes(url.protocol)) {
      issue(
        file,
        "unsafe-url-scheme",
        `${resource ? "Resource" : "Link"}: ${url.protocol}`,
      );
      return;
    }
    if (resource) {
      resources.set(`${file}:${url.href}`, { file, url: url.href });
      if (!allowed.has(url.origin)) issue(file, "external-resource", url.href);
      if (url.origin !== origin && url.protocol !== "https:")
        issue(file, "insecure-resource", url.href);
    } else if (url.origin !== origin) {
      links.set(url.href, { url: url.href });
    }
    if (!resource && executableFile.test(decodeURIComponent(url.pathname)))
      issue(file, "executable-link", url.href);
    if (download && (url.origin !== origin || !/\.pdf$/i.test(url.pathname))) {
      issue(
        file,
        "unexpected-download",
        "Only explicit local PDF downloads are approved",
      );
    }
    if (download && url.origin === origin) {
      resources.set(`${file}:${url.href}`, {
        file,
        url: url.href,
        kind: "download",
      });
    }
  }

  function checkCSS(source, file, context = "stylesheet") {
    try {
      const ast = css.parse(source, {
        context,
        parseCustomProperty: true,
        onParseError(error) {
          issue(file, "css-parse", error.message);
        },
      });
      css.walk(ast, function (node) {
        if (node.type === "Raw")
          issue(file, "unparsed-css", "CSS could not be fully inspected");
        if (node.type === "Url") checkURL(node.value, file, { resource: true });
        if (
          node.type === "String" &&
          ((this.atrule &&
            css.ident.decode(this.atrule.name).toLowerCase() === "import") ||
            (this.function &&
              ["url", "image-set", "-webkit-image-set"].includes(
                css.ident.decode(this.function.name).toLowerCase(),
              )))
        )
          checkURL(node.value, file, { resource: true });
        if (
          node.type === "Function" &&
          css.ident.decode(node.name).toLowerCase() === "expression"
        ) {
          issue(file, "active-css", "CSS expression is forbidden");
        }
        if (
          node.type === "Declaration" &&
          ["behavior", "-moz-binding"].includes(
            css.ident.decode(node.property).toLowerCase(),
          )
        ) {
          issue(file, "active-css", node.property);
        }
      });
    } catch (error) {
      issue(file, "css-parse", error.message);
    }
  }

  function checkDocument(source, file, standaloneSVG) {
    if (standaloneSVG && /<!\s*(?:DOCTYPE|ENTITY)\b/i.test(source))
      issue(
        file,
        "svg-entity",
        "SVG entity/doctype declarations are forbidden",
      );
    if (standaloneSVG && /<\?(?!xml\s)[\w:-]/i.test(source))
      issue(
        file,
        "svg-processing",
        "SVG processing instructions are forbidden",
      );
    const document = parseDocument(source, { xmlMode: standaloneSVG });
    for (const { node, svg } of elements(document, standaloneSVG)) {
      // XML permits arbitrary prefixes for SVG/XLink. Inspect local names
      // conservatively so aliases cannot hide active elements or references.
      const tag = node.name.toLowerCase().split(":").at(-1);
      const attrs = Object.fromEntries(
        Object.entries(node.attribs).map(([key, value]) => [
          key.toLowerCase(),
          value,
        ]),
      );
      if (forbiddenHTML.has(tag) || (svg && forbiddenSVG.has(tag)))
        issue(file, "active-element", tag);
      if (
        tag === "meta" &&
        attrs["http-equiv"]?.toLowerCase().trim() === "refresh"
      )
        issue(file, "redirect", "meta refresh");
      for (const key of Object.keys(attrs)) {
        if (key.startsWith("on"))
          issue(file, "event-handler", `${tag}[${key}]`);
        if (
          ["srcdoc", "ping", "action", "formaction", "xml:base"].includes(key)
        )
          issue(file, "active-attribute", `${tag}[${key}]`);
      }
      if (attrs.style) checkCSS(attrs.style, file, "declarationList");
      if (tag === "style") checkCSS(textContent(node), file);
      for (const key of ["src", "poster", "background"]) {
        if (attrs[key] !== undefined)
          checkURL(attrs[key], file, { resource: true });
      }
      for (const key of ["srcset", "imagesrcset"]) {
        if (!attrs[key]) continue;
        // WHATWG srcset parsing handles commas inside data URLs.
        const candidates = parseSrcset(attrs[key]);
        if (!candidates.length) issue(file, "invalid-srcset", `${tag}[${key}]`);
        for (const candidate of candidates)
          checkURL(candidate.url, file, { resource: true });
      }
      for (const key of Object.keys(attrs).filter(
        (key) => key.split(":").at(-1) === "href",
      )) {
        const resource =
          (svg && tag !== "a") ||
          (tag === "link" &&
            (attrs.rel ?? "")
              .toLowerCase()
              .split(/\s+/)
              .some((rel) => resourceRelations.has(rel)));
        checkURL(attrs[key], file, {
          resource,
          download: Object.hasOwn(attrs, "download"),
        });
      }
    }
  }

  async function walk(directoryPath) {
    for (const entry of await readdir(directoryPath, { withFileTypes: true })) {
      const path = resolve(directoryPath, entry.name);
      const file = slash(relative(root, path));
      if (entry.isSymbolicLink()) {
        issue(file, "symlink", "Published assets must be regular files");
        continue;
      }
      if (entry.isDirectory()) {
        await walk(path);
        continue;
      }
      if (!entry.isFile()) {
        issue(file, "special-file", "Unexpected file type");
        continue;
      }
      report.checkedFiles++;
      const extension = extname(file).toLowerCase();
      if ([".html", ".svg", ".css"].includes(extension)) {
        const source = await readFile(path, "utf8");
        if (extension === ".css") checkCSS(source, file);
        else {
          if (extension === ".html") report.htmlPages++;
          checkDocument(source, file, extension === ".svg");
        }
      }
    }
  }
  await walk(root);
  if (!report.htmlPages)
    throw new Error("No generated HTML found; build the site first");
  for (const { file, url: value } of resources.values()) {
    const url = new URL(value);
    if (url.origin !== origin) continue;
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      issue(file, "invalid-path", value);
      continue;
    }
    if (
      !pathname.startsWith(base) ||
      pathname.includes("\\") ||
      pathname.includes("\0")
    ) {
      issue(file, "resource-outside-base", value);
      continue;
    }
    const target = resolve(root, pathname.slice(base.length));
    const rel = relative(root, target);
    if (rel.startsWith(`..${sep}`) || rel === ".." || target === root) {
      issue(file, "resource-outside-build", value);
      continue;
    }
    try {
      if (!(await stat(target)).isFile()) throw new Error("Not a file");
    } catch {
      issue(file, "missing-resource", value);
    }
  }
  report.resources = [...resources.values()].sort((a, b) =>
    `${a.file}:${a.url}`.localeCompare(`${b.file}:${b.url}`),
  );
  report.externalLinks = [...links.values()].sort((a, b) =>
    a.url.localeCompare(b.url),
  );
  report.issues.sort((a, b) =>
    `${a.file}:${a.rule}`.localeCompare(`${b.file}:${b.rule}`),
  );
  report.status = report.issues.length ? "failed" : "passed";
  return report;
}

async function main() {
  const output = resolve(".test-output/security/build.json");
  let report;
  try {
    const { loadSite } = await import("sciastro");
    const site = await loadSite(resolve("sciastro.yaml"), {
      url: process.env.SITE_URL,
      base: process.env.BASE_PATH,
    });
    report = await inspectBuild({
      directory: process.env.BUILD_DIR ?? "dist",
      siteURL: site.config.url,
      base: site.config.base,
      policy: await loadSecurityPolicy(),
    });
    if (report.issues.length) {
      for (const { file, rule, detail } of report.issues)
        console.error(`${file}: ${rule}: ${detail}`);
      process.exitCode = 1;
    } else
      console.log(
        `Build security checks passed: ${report.htmlPages} HTML pages, ${report.checkedFiles} files; external links inventoried separately.`,
      );
  } catch (error) {
    report = { status: "error", error: error.message };
    console.error(`Build security checks could not run: ${error.message}`);
    process.exitCode = 2;
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Report: ${relative(process.cwd(), output)}`);
}

if (
  process.argv[1] &&
  realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])
)
  await main();
