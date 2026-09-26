import test from "node:test";
import assert from "node:assert/strict";
import { glob, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { loadSite } from "sciastro";
import apacheStaticHosting from "../build/apache.mjs";

function assertApacheConfig(source, errorPage) {
  assert.match(source, /^AddDefaultCharset UTF-8$/m);
  assert.match(source, /^DirectoryIndex index\.html$/m);
  assert.deepEqual(
    source.match(/^ErrorDocument 404 .+$/gm),
    [`ErrorDocument 404 ${errorPage}`],
    "Apache serves the custom 404 inside the deployment base",
  );
}

for (const base of ["/", "/~volpatto/", "/~volpatto"]) {
  test(`Apache integration generates hosting configuration for ${base}`, async (t) => {
    const directory = await mkdtemp(join(tmpdir(), "website-apache-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const integration = apacheStaticHosting();
    integration.hooks["astro:config:done"]({ config: { base } });
    await integration.hooks["astro:build:done"]({
      dir: pathToFileURL(directory + sep),
    });
    const source = await readFile(join(directory, ".htaccess"), "utf8");
    assertApacheConfig(
      source,
      base === "/" ? "/404.html" : "/~volpatto/404.html",
    );
  });
}

test("SciAstro accepts Apache user directories in pages and resource URLs", async () => {
  const base = "/~volpatto/";
  const url = "https://www.lncc.br";
  const site = await loadSite(resolve("sciastro.yaml"), { url, base });
  assert.equal(site.config.base, base);
  assert(site.pages.every((page) => page.path.startsWith(base)));
  for (const locale of site.config.locales) {
    const home = site.pages.find(
      (page) => page.id === "home" && page.locale === locale,
    );
    assert.equal(
      home.path,
      locale === site.config.defaultLocale ? base : `${base}${locale}/`,
    );
  }
  assert(
    site.socialImage.url.startsWith(`${url}${base}`),
    "local sharing image uses the same Apache user directory",
  );
});

test("generated Apache configuration matches the selected deployment", async () => {
  const site = await loadSite(resolve("sciastro.yaml"), {
    url: process.env.SITE_URL,
    base: process.env.BASE_PATH,
  });
  const directory = resolve(process.env.BUILD_DIR ?? "dist");
  const source = await readFile(join(directory, ".htaccess"), "utf8");
  assertApacheConfig(source, `${site.config.base}404.html`);
  const errorPage = await readFile(join(directory, "404.html"), "utf8");
  assert.match(errorPage, /<meta charset="utf-8">/);
});

test("generated CSS keeps fonts in files allowed by LNCC's HTTP CSP", async () => {
  const directory = resolve(process.env.BUILD_DIR ?? "dist");
  const stylesheets = [];
  for await (const name of glob("**/*.css", { cwd: directory })) {
    stylesheets.push(name);
    const css = await readFile(join(directory, name), "utf8");
    assert.doesNotMatch(
      css,
      /data:(?:font\/|application\/(?:x-)?font)/i,
      `${name}: embedded fonts are blocked by LNCC's HTTP CSP`,
    );
  }
  assert(stylesheets.length > 0, "the build contains generated CSS");
});
