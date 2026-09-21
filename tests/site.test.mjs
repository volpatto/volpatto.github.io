import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { loadSite } from "sciastro";

const site = await loadSite(resolve("sciastro.yaml"), {
  url: process.env.SITE_URL,
  base: process.env.BASE_PATH,
});
const directory = resolve(process.env.BUILD_DIR ?? "dist");
const { base, url } = site.config;
const readPage = (page) =>
  readFile(join(directory, page.path.slice(base.length), "index.html"), "utf8");
const ids = (html) => [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);

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
