import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(process.env.BUILD_DIR || "dist");
const prefix =
  "/" +
  (process.env.BASE_PATH ?? "/").replace(/^\/+|\/+$/g, "");
const base = prefix === "/" ? "" : prefix;
const pagePairs = [
  ["home", "", "en/"],
  ["research", "pesquisa/", "en/research/"],
  ["publications", "publicacoes/", "en/publications/"],
  ["software", "software/", "en/software/"],
  ["teaching", "ensino/", "en/teaching/"],
  ["people", "orientacoes/", "en/supervision/"],
  ["groups", "grupos/", "en/groups/"],
  ["collaborations", "parcerias/", "en/collaborations/"],
  ["cv", "curriculo/", "en/cv/"],
  ["contact", "contato/", "en/contact/"],
  ["licensing", "licenciamento/", "en/licensing/"],
];
const idsOf = (html) =>
  [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
function checkLinks(html, file) {
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(?:https?:|mailto:|data:|\/\/)/.test(value)) continue;
    const [path, fragment] = value.split("#");
    let local = path
      ? resolve(
          root,
          "." + decodeURIComponent(path.split("?")[0]).slice(base.length),
        )
      : resolve(root, file);
    if (path)
      assert(
        path.startsWith(base + "/"),
        `${file}: missing base path in ${path}`,
      );
    assert(
      local === root || local.startsWith(root + "/"),
      `Path outside dist: ${local}`,
    );
    assert(existsSync(local), `${file}: broken local link ${value}`);
    if (statSync(local).isDirectory()) local = resolve(local, "index.html");
    assert(existsSync(local), `${file}: missing route ${value}`);
    if (fragment && local.endsWith(".html"))
      assert(
        idsOf(readFileSync(local, "utf8")).includes(fragment),
        `${file}: broken anchor ${value}`,
      );
  }
}
const titles = new Set();
for (const [id, ptPath, enPath] of pagePairs) {
  for (const [path, language] of [
    [ptPath, "pt-BR"],
    [enPath, "en"],
  ]) {
    const file = path + "index.html";
    const html = readFileSync(resolve(root, file), "utf8");
    assert(html.includes(`lang="${language}"`), `${file}: incorrect language`);
    assert(html.includes(`data-page="${id}"`), `${file}: incorrect page`);
    assert.equal(
      (html.match(/<h1\b/g) || []).length,
      1,
      `${file}: expected one page heading`,
    );
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    assert(
      title && !titles.has(`${language}:${title}`),
      `${file}: missing or duplicate title in language`,
    );
    titles.add(`${language}:${title}`);
    const ids = idsOf(html);
    assert.equal(new Set(ids).size, ids.length, `${file}: duplicate ids`);
    assert(ids.includes("main"), `${file}: missing main anchor`);
    for (const [otherId] of pagePairs.filter((p) => p[0] !== "home")) {
      assert.equal(
        ids.includes(otherId),
        otherId === id,
        `${file}: content belongs on ${otherId} page`,
      );
    }
    const nav = html.match(/<nav id="main-nav"[\s\S]*?<\/nav>/)?.[0] || "";
    assert.equal(
      (nav.match(/aria-current="page"/g) || []).length,
      id === "licensing" ? 0 : 1,
      `${file}: incorrect number of active academic navigation items`,
    );
    assert.equal(
      (nav.match(/<a /g) || []).length,
      10,
      `${file}: incomplete main navigation`,
    );
    if (id !== "licensing")
      assert(
        nav.includes(`data-page="${id}" aria-current="page"`),
        `${file}: wrong active navigation item`,
      );
    const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0] || "";
    const licensePath = language === "en" ? "en/licensing/" : "licenciamento/";
    assert(
      footer.includes(`href="${base}/${licensePath}"`) &&
        footer.includes("CC BY 4.0") &&
        footer.includes(`href="${base}/licenses/MIT.txt"`),
      `${file}: missing scoped licensing notice or matching-language link`,
    );
    if (id === "licensing") {
      assert(footer.includes('aria-current="page"'), `${file}: missing active footer link`);
      assert(
        html.includes("Operational Research Society 2021") &&
          html.includes("Manrope-OFL.txt") && html.includes("Newsreader-OFL.txt") &&
          html.includes("CC-BY-4.0.txt"),
        `${file}: missing third-party notices or full license texts`,
      );
    }
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert(
      canonical && new URL(canonical).pathname === `${base}/${path}`,
      `${file}: wrong canonical`,
    );
    for (const [lang, alternate] of [
      ["pt-BR", ptPath],
      ["en", enPath],
    ]) {
      const alternateUrl = html.match(
        new RegExp(`<link rel="alternate" hreflang="${lang}" href="([^"]+)"`),
      )?.[1];
      assert(
        alternateUrl &&
          new URL(alternateUrl).pathname === `${base}/${alternate}`,
        `${file}: wrong language alternate`,
      );
    }
    checkLinks(html, file);
    if (id === "publications")
      assert.equal(
        (html.match(/class="publication"/g) || []).length,
        7,
        `${file}: expected seven articles`,
      );
    if (id === "people")
      assert.equal(
        (html.match(/class="person"/g) || []).length,
        6,
        `${file}: expected six current students`,
      );
    if (id === "collaborations")
      for (const partner of ["alfa", "lef", "udesc"])
        assert(ids.includes(partner), `${file}: missing partner ${partner}`);
    if (id === "cv")
      assert(
        html.includes("ESSS") && html.includes("2018"),
        `${file}: missing professional experience`,
      );
    else
      assert(
        !/\bESSS\b|Engineering Simulation and Scientific Software/.test(html),
        `${file}: company name belongs only in the CV`,
      );
    assert(html.includes("theme-toggle"), `${file}: missing theme control`);
    console.log(`OK: ${file}`);
  }
}
checkLinks(readFileSync(resolve(root, "404.html"), "utf8"), "404.html");
assert(
  readFileSync(resolve(root, "files/cv-diego-volpatto-2026.pdf"))
    .subarray(0, 5)
    .toString() === "%PDF-",
  "Invalid CV PDF",
);
console.log(
  "OK: 22 pages, scoped licensing, navigation, language alternates, internal links, images, 404 and CV download",
);
