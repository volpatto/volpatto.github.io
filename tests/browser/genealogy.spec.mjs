import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadSite } from "sciastro";
import { loadGenealogy } from "../../build/genealogy.mjs";

const [site, data] = await Promise.all([
  loadSite(resolve("sciastro.yaml"), {
    url: process.env.SITE_URL,
    base: process.env.BASE_PATH,
  }),
  loadGenealogy(),
]);
const pageFor = (id, locale = "pt") =>
  site.pages.find((record) => record.id === id && record.locale === locale);
const personFor = (id) => data.people.find((person) => person.id === id);
const assetFor = (locale, extension) =>
  `${site.config.base}files/genealogy/academic-genealogy-${locale}.${extension}`;
const noDocumentOverflow = async (page) =>
  expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    .toBe(true);

// Routes and asset URLs follow the configured deployment base, including /~volpatto/.
test("genealogy keeps its page across languages and shows two converging ancestor branches", async ({
  page,
}) => {
  await page.goto(pageFor("genealogy").path);
  for (const locale of ["pt", "en", "pt"]) {
    await page.locator(`.languages a[lang="${locale}"]`).click();
    await expect(page).toHaveURL(
      (url) => url.pathname === pageFor("genealogy", locale).path,
    );
    await expect(page.locator("h1")).toHaveText(
      pageFor("genealogy", locale).title,
    );
    const navigation = await page
      .locator(".navigation-tree > .navigation-item > a")
      .evaluateAll((links) => links.map((link) => link.dataset.page));
    expect(navigation.indexOf("curiosities")).toBeGreaterThanOrEqual(0);
    expect(navigation.indexOf("contact")).toBe(
      navigation.indexOf("curiosities") + 1,
    );
    await expect(
      page.locator('.navigation a[data-page="genealogy"]'),
    ).toHaveAttribute("aria-current", "page");

    const branches = page.locator(".genealogy-branches > .genealogy-branch");
    await expect(branches).toHaveCount(2);
    for (const [index, id] of ["euler", "gauss"].entries()) {
      const person = personFor(id);
      await expect(branches.nth(index).locator("h3")).toHaveText(person.name);
      await expect(
        branches.nth(index).locator(".genealogy-branch-distance > span"),
      ).toHaveText(`${person.distance}*`);
    }
    await expect(
      page.locator(".genealogy-lineage > li").first().locator("h3"),
    ).toHaveText(personFor("klein").name);
    for (const id of ["prandtl", "timoshenko"]) {
      const person = personFor(id);
      const row = page.locator(".genealogy-person").filter({
        has: page.getByRole("heading", { name: person.name, exact: true }),
      });
      await expect(row.locator(".genealogy-distance")).toHaveText(
        String(person.distance),
      );
    }
    await noDocumentOverflow(page);
  }
});

test("diagram supports keyboard disclosure, zoom, fitting and contained scrolling", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pageFor("genealogy").path);
  const diagram = page.locator("[data-genealogy-diagram]");
  const summary = diagram.locator(":scope > summary");
  await expect(diagram).not.toHaveAttribute("open", "");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(diagram).toHaveAttribute("open", "");
  await expect(diagram.locator("genealogy-viewer")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const viewport = diagram.locator(".genealogy-viewport");
  const image = diagram.locator("img");
  await expect
    .poll(() => image.evaluate((el) => el.naturalWidth))
    .toBeGreaterThan(0);
  const originalWidth = await image.evaluate((el) => el.clientWidth);
  await diagram.locator('[data-zoom="in"]').click();
  await expect
    .poll(() => image.evaluate((el) => el.clientWidth))
    .toBeGreaterThan(originalWidth);
  await viewport.evaluate((el) => {
    el.scrollLeft = 0;
  });
  await viewport.focus();
  await expect(viewport).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  await noDocumentOverflow(page);

  await diagram.locator('[data-zoom="out"]').click();
  expect(
    Math.abs((await image.evaluate((el) => el.clientWidth)) - originalWidth),
  ).toBeLessThanOrEqual(2);
  await diagram.locator('[data-zoom="fit"]').click();
  await expect(diagram.locator("output")).toHaveText("100%");
  expect(
    await viewport.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  for (const button of await diagram.locator("button").all()) {
    const box = await button.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await noDocumentOverflow(page);
  await summary.focus();
  await page.keyboard.press("Space");
  await expect(diagram).not.toHaveAttribute("open", "");
  expect(errors).toEqual([]);
});

test("localized SVG and JSON links download the documented graph", async ({
  page,
}) => {
  for (const locale of site.config.locales) {
    await page.goto(pageFor("genealogy", locale).path);
    const links = page.locator(".genealogy-downloads");
    await expect(links.locator("a:not([download])")).toHaveAttribute(
      "href",
      assetFor(locale, "svg"),
    );
    for (const extension of ["svg", "json"]) {
      const link = links.locator(`a[download][href$=".${extension}"]`);
      await expect(link).toHaveAttribute("href", assetFor(locale, extension));
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        link.click(),
      ]);
      expect(await download.failure()).toBeNull();
      expect(download.suggestedFilename()).toBe(
        `academic-genealogy-${locale}.${extension}`,
      );
      const content = await readFile(await download.path(), "utf8");
      if (extension === "json") {
        const exported = JSON.parse(content);
        expect(exported.locale).toBe(locale);
        expect(exported.edges).toEqual(data.edges);
        expect(exported.people.map((person) => person.id)).toEqual(
          data.people.map((person) => person.id),
        );
      } else {
        const document = await page.evaluate((text) => {
          const xml = new DOMParser().parseFromString(text, "image/svg+xml");
          return {
            root: xml.documentElement.localName,
            errors: xml.querySelectorAll("parsererror").length,
            language: xml.documentElement.getAttribute("xml:lang"),
            nodes: xml.querySelectorAll("g.node").length,
            edges: xml.querySelectorAll("g.edge").length,
          };
        }, content);
        expect(document).toEqual({
          root: "svg",
          errors: 0,
          language: locale,
          nodes: data.people.length,
          edges: data.edges.length,
        });
      }
    }
  }
});

test("without JavaScript the diagram and full text evidence remain available", async ({
  browser,
  baseURL,
}, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
  });
  try {
    const page = await context.newPage();
    await page.goto(new URL(pageFor("genealogy").path, baseURL).href);
    const diagram = page.locator("[data-genealogy-diagram]");
    await diagram.locator(":scope > summary").focus();
    await page.keyboard.press("Enter");
    await expect(diagram).toHaveAttribute("open", "");
    await expect(diagram.locator(".genealogy-viewer-toolbar")).toBeHidden();
    await expect
      .poll(() => diagram.locator("img").evaluate((el) => el.naturalWidth))
      .toBeGreaterThan(0);
    const evidence = page.locator("[data-genealogy-evidence]");
    await evidence.locator(":scope > summary").focus();
    await page.keyboard.press("Enter");
    await expect(evidence).toHaveAttribute("open", "");
    await expect(evidence.locator(".genealogy-edge-list > li")).toHaveCount(
      data.edges.length,
    );
    await expect(evidence.locator(".genealogy-source-list > li")).toHaveCount(
      data.sources.length,
    );
    await expect(
      evidence.locator(".genealogy-source-list a").first(),
    ).toBeVisible();
    await noDocumentOverflow(page);
  } finally {
    await context.close();
  }
});
