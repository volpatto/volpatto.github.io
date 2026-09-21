import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { loadSite } from "sciastro";
const site = await loadSite(resolve("sciastro.yaml"), {
  url: process.env.SITE_URL,
  base: process.env.BASE_PATH,
});
const pt = (id) => site.pages.find((p) => p.id === id && p.locale === "pt");

test("footer has one copyright, aligned framework credit and full-width licensing", async ({
  page,
}, info) => {
  for (const locale of ["pt", "en"]) {
    await page.goto(
      site.pages.find((p) => p.id === "home" && p.locale === locale).path,
    );
    await page.evaluate(() => document.fonts.ready);
    const footer = page.locator(".site-footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.locator(".footer-primary")).toContainText(
      "© 2026 Diego Tavares Volpatto",
    );
    await expect(
      footer.getByText("Diego Volpatto", { exact: true }),
    ).toHaveCount(0);
    await expect(
      footer.getByRole("link", {
        name: locale === "pt" ? "Feito com SciAstro" : "Built with SciAstro",
        exact: true,
      }),
    ).toBeVisible();
    const layout = await footer.evaluate((el) => {
      const primary = el
        .querySelector(".footer-primary")
        .getBoundingClientRect();
      const credit = el.querySelector(".footer-links").getBoundingClientRect();
      const notes = el.querySelector(".footer-content");
      const rect = notes.getBoundingClientRect();
      const lineHeight = parseFloat(getComputedStyle(notes).lineHeight);
      return {
        primary: primary.toJSON(),
        credit: credit.toJSON(),
        notes: rect.toJSON(),
        width: el.clientWidth,
        lineHeight,
      };
    });
    expect(layout.notes.width).toBeCloseTo(layout.width, 0);
    if (info.project.name === "desktop") {
      expect(Math.abs(layout.primary.y - layout.credit.y)).toBeLessThan(2);
      expect(layout.credit.x).toBeGreaterThan(
        layout.primary.x + layout.primary.width,
      );
      expect(layout.notes.height).toBeLessThanOrEqual(layout.lineHeight + 1);
    } else {
      expect(layout.credit.y).toBeGreaterThan(layout.primary.y);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("all pages load in both themes without horizontal overflow or runtime errors", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const responses = [];
  page.on("response", (r) => {
    if (r.status() >= 400) responses.push(r.url());
  });
  for (const mode of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: mode });
    for (const record of site.pages) {
      await page.goto(record.path);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      if (record.id === "home" && record.locale === "pt") {
        await page.evaluate(() => document.fonts.ready);
        await mkdir(".test-output/review", { recursive: true });
        await page.screenshot({
          path: `.test-output/review/home-${info.project.name}-${mode}.png`,
          fullPage: true,
        });
      }
    }
  }
  expect(errors).toEqual([]);
  expect(responses).toEqual([]);
});

test("language switch, saved theme and navigation preserve the selected page", async ({
  page,
}, info) => {
  await page.goto(pt("software").path);
  await page.locator(".theme-toggle").click();
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(
      site.pages.find((p) => p.id === "software" && p.locale === "en").path +
        "$",
    ),
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  if (info.project.name === "mobile")
    await page.locator(".navigation summary").click();
  await expect(page.locator('.navigation a[aria-current="page"]')).toHaveText(
    "Software",
  );
  if (info.project.name === "mobile") {
    await page.keyboard.press("Escape");
    await expect(page.locator(".navigation summary")).toBeFocused();
  }
});

test("research figures, partner logos and CV remain reachable", async ({
  page,
  request,
}) => {
  await page.goto(pt("research").path);
  for (const image of await page.locator("main .sp-figure a > img").all()) {
    const href = await image.getAttribute("src");
    expect((await request.get(href)).ok()).toBe(true);
  }
  await page.goto(pt("collaborations").path);
  const links = await page.locator(".sp-logo-grid a").all();
  expect(links.length).toBeGreaterThan(0);
  for (const link of links)
    await expect(link.locator("img")).toHaveAttribute("alt", /.+/);
  await page.goto(pt("cv").path);
  const href = await page.locator("a[download]").getAttribute("href");
  const response = await request.get(href);
  expect(response.ok()).toBe(true);
  expect((await response.body()).subarray(0, 4).toString()).toBe("%PDF");
});
