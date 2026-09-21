import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { loadSite } from "sciastro";
import { Bibliography } from "sciastro/bibliography";

const site = await loadSite(resolve("sciastro.yaml"), {
  url: process.env.SITE_URL,
  base: process.env.BASE_PATH,
});
const directory = resolve(process.env.BUILD_DIR ?? "dist");
const { base, url } = site.config;
const readPage = (page) =>
  readFile(join(directory, page.path.slice(base.length), "index.html"), "utf8");
const ids = (html) => [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const publications = (page) =>
  page.sections.flatMap((section) => section.publications ?? []);
const publicationPages = site.pages.filter(
  (page) => page.id === "publications",
);
const escapeHTML = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

// These tests derive content from YAML, so normal editorial edits need no test changes.
test("each configured page has all enabled languages and a unique URL", () => {
  assert.equal(
    site.pages.length,
    site.config.pageFiles.length * site.config.locales.length,
  );
  assert.equal(new Set(site.pages.map((p) => p.path)).size, site.pages.length);
  assert.equal(site.config.theme, "lncc");
});

for (const page of site.pages) {
  test(`${page.path}: page structure, metadata, navigation, assets and local links`, async () => {
    const html = await readPage(page);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, "one main heading");
    assert.equal(new Set(ids(html)).size, ids(html).length, "unique anchors");
    assert(
      html.includes(`lang="${page.locale === "pt" ? "pt-BR" : page.locale}"`),
    );
    assert(html.includes(`href="${new URL(page.path, url)}"`), "canonical URL");
    for (const locale of site.config.locales) {
      const translated = site.pages.find(
        (p) => p.id === page.id && p.locale === locale,
      );
      assert(
        html.includes(`href="${translated.path}"`),
        "language switch keeps the page",
      );
    }
    const nav = html.match(
      /<nav aria-label="(?:Navegação principal|Main navigation)"[\s\S]*?<\/nav>/,
    )?.[0];
    assert(nav, "main navigation");
    assert.equal(
      (nav.match(/aria-current="page"/g) ?? []).length,
      page.navigation ? 1 : 0,
    );
    assert.equal(
      (nav.match(/<a\b/g) ?? []).length,
      site.pages.filter((p) => p.locale === page.locale && p.navigation).length,
    );
    for (const [, raw] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const value = raw.replaceAll("&amp;", "&");
      if (/^(?:[a-z]+:|\/\/)/i.test(value)) continue;
      const [path, fragment] = value.split("#");
      let target = join(directory, page.path.slice(base.length), "index.html");
      if (path) {
        assert(path.startsWith(base), `link missing base path: ${path}`);
        target = resolve(
          directory,
          decodeURIComponent(path.split("?")[0].slice(base.length)),
        );
        assert(
          target === directory || target.startsWith(directory + "/"),
          "asset inside dist",
        );
        const info = await stat(target);
        if (info.isDirectory()) target = join(target, "index.html");
      }
      await stat(target);
      if (fragment && target.endsWith(".html"))
        assert(
          ids(await readFile(target, "utf8")).includes(
            decodeURIComponent(fragment),
          ),
          `anchor ${value}`,
        );
    }
  });
}

test("the CV remains downloadable and third-party licensing is reachable", async () => {
  const cv = site.pages.find(
    (p) => p.id === "cv" && p.locale === site.config.defaultLocale,
  );
  const html = await readPage(cv);
  assert.match(html, /<a[^>]*href="[^"]+\.pdf"[^>]*download/);
  assert(site.pages.some((p) => p.id === "licensing" && !p.navigation));
  const licensing = site.pages.find(
    (p) => p.id === "licensing" && p.locale === site.config.defaultLocale,
  );
  assert.match(await readPage(licensing), /creativecommons.org/);
});

test("publication cards render BibTeX metadata and editorial categories in both languages", async () => {
  const libraries = new Map();
  for (const page of publicationPages) {
    const records = publications(page);
    assert(records.length > 0);
    const html = await readPage(page);
    const cards = [
      ...html.matchAll(
        /<article class="sp-publication"[^>]*>[\s\S]*?<\/article>/g,
      ),
    ];
    assert.equal(cards.length, records.length);
    assert.equal(
      page.references.length,
      0,
      "cards do not duplicate a reference list",
    );
    for (const [index, publication] of records.entries()) {
      assert(
        publication.bibtex,
        "publication metadata comes from a BibTeX entry",
      );
      const source = publication.bibtex;
      const file =
        typeof source === "string"
          ? site.config.bibliography.file
          : source.file;
      const key = typeof source === "string" ? source : source.key;
      if (!libraries.has(file))
        libraries.set(
          file,
          new Bibliography(
            await readFile(resolve(site.config.contentDir, file), "utf8"),
          ),
        );
      const expected = libraries.get(file).publication(key);
      const card = cards[index][0];
      for (const field of [
        "title",
        "authors",
        "year",
        "journal",
        "citation",
        "doi",
      ]) {
        assert.equal(
          publication[field],
          expected[field],
          `${key}: automatic ${field}`,
        );
        if (expected[field])
          assert(
            card.includes(escapeHTML(expected[field])),
            `${key}: rendered ${field}`,
          );
      }
      assert(publication.topic, `${key}: retains an editorial category`);
      assert(card.includes(escapeHTML(publication.topic)));
      assert(card.includes(`href="https://doi.org/${expected.doi}"`));
    }
  }
  assert.deepEqual(
    publications(publicationPages[0]).map((p) => p.doi),
    publications(publicationPages[1]).map((p) => p.doi),
    "translations select the same works in the same order",
  );
});

test("editing only the BibTeX updates publication cards and missing keys are rejected", async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), "volpatto-bibtex-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await cp("sciastro.yaml", join(temporary, "sciastro.yaml"));
  await cp(site.config.contentDir, join(temporary, site.config.contentDir), {
    recursive: true,
  });
  await cp("public", join(temporary, "public"), { recursive: true });
  const original = publications(publicationPages[0])[0];
  const source = original.bibtex;
  const file =
    typeof source === "string" ? site.config.bibliography.file : source.file;
  const key = typeof source === "string" ? source : source.key;
  const bibfile = join(temporary, site.config.contentDir, file);
  const bibtex = await readFile(bibfile, "utf8");
  const updatedTitle = "Title edited exclusively in BibTeX";
  assert(bibtex.includes(original.title));
  await writeFile(bibfile, bibtex.replace(original.title, updatedTitle));
  const updated = await loadSite(join(temporary, "sciastro.yaml"));
  for (const page of updated.pages.filter((p) => p.id === "publications")) {
    const result = publications(page).find((p) => p.doi === original.doi);
    assert.equal(result.title, updatedTitle);
    const previous = publications(
      publicationPages.find((p) => p.locale === page.locale),
    ).find((p) => p.doi === original.doi);
    assert.equal(result.topic, previous.topic, "category stays in the YAML");
  }
  await writeFile(bibfile, bibtex.replace(`{${key},`, "{removed-entry,"));
  await assert.rejects(
    () => loadSite(join(temporary, "sciastro.yaml")),
    (error) =>
      error.message.includes(key) &&
      /não encontrada|not found/i.test(error.message),
  );
});
