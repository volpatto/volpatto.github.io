import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { loadSite } from "sciastro";
const site = await loadSite(resolve("sciastro.yaml"), {
  url: process.env.SITE_URL,
  base: process.env.BASE_PATH,
});
const pt = (id) => site.pages.find((p) => p.id === id && p.locale === "pt");

test("About portrait uses a circular frame with its caption outside the image", async ({
  page,
}) => {
  for (const locale of site.config.locales) {
    await page.goto(
      site.pages.find((p) => p.id === "home" && p.locale === locale).path,
    );
    const figure = page.locator("#hero-title .sp-figure");
    const frame = figure.locator(".sp-figure-media");
    const portrait = frame.locator("img");
    await expect(frame).toHaveCSS("border-radius", "50%");
    await expect(frame).toHaveCSS("overflow", "hidden");
    await expect(portrait).toHaveCSS("object-fit", "cover");
    await expect(portrait).toHaveCSS("object-position", "50% 50%");
    expect(
      await portrait.evaluate(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    ).toBe(true);
    const bounds = await frame.boundingBox();
    expect(Math.abs(bounds.width - bounds.height)).toBeLessThan(1);
    const caption = figure.locator("figcaption");
    await expect(caption).toHaveText(
      locale === "pt" ? "Petrópolis, Brasil" : "Petrópolis, Brazil",
    );
    expect((await caption.boundingBox()).y).toBeGreaterThanOrEqual(
      bounds.y + bounds.height,
    );
  }
});

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
      if (["home", "research"].includes(record.id)) {
        await page.evaluate(() => document.fonts.ready);
        const figures = page
          .locator("main figure.sp-figure")
          .filter({ has: page.locator("figcaption") });
        expect(await figures.count()).toBeGreaterThan(0);
        for (const figure of await figures.all()) {
          const caption = figure.locator("figcaption");
          await expect(caption).toHaveCSS("text-align", "center");
          const frame = await figure.locator(".sp-figure-media").boundingBox();
          const captionBox = await caption.boundingBox();
          expect(
            Math.abs(
              captionBox.x + captionBox.width / 2 - (frame.x + frame.width / 2),
            ),
          ).toBeLessThan(1);
          const credits = caption.locator(".sp-links");
          if (await credits.count()) {
            await expect(credits).toHaveCSS("justify-content", "center");
            await expect(credits.locator("a").first()).toBeVisible();
          }
          if (record.id === "home") {
            const textBox = await caption.evaluate((element) => {
              const range = document.createRange();
              range.selectNodeContents(element);
              return range.getBoundingClientRect().toJSON();
            });
            expect(
              Math.abs(
                textBox.x + textBox.width / 2 - (frame.x + frame.width / 2),
              ),
            ).toBeLessThan(1);
          }
        }
      }
      if (
        ["home", "publications", "people"].includes(record.id) &&
        record.locale === "pt"
      ) {
        await page.evaluate(() => document.fonts.ready);
        await mkdir(".test-output/review", { recursive: true });
        await page.screenshot({
          path: `.test-output/review/${record.id}-${info.project.name}-${mode}.png`,
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

test("supervision shows each student's data and a circular portrait or institutional symbol", async ({
  page,
}) => {
  const localized = (value, locale) =>
    typeof value === "string" ? value : value[locale];
  for (const locale of site.config.locales) {
    await page.goto(
      site.pages.find((p) => p.id === "people" && p.locale === locale).path,
    );
    await expect(page.locator(".member-card")).toHaveCount(site.members.length);
    for (const member of site.members) {
      const card = page.locator(`#member-${member.id}`);
      await expect(
        card.getByRole("heading", { name: member.name, exact: true }),
      ).toBeVisible();
      await expect(card).toContainText(localized(member.affiliation, locale));
      if (member.topic)
        await expect(card).toContainText(localized(member.topic, locale));
      if (member.startYear)
        await expect(card).toContainText(String(member.startYear));
      if (member.endYear)
        await expect(card).toContainText(String(member.endYear));
      const section =
        member.status === "alumni" ? "#alumni" : `#level-${member.level}`;
      await expect(page.locator(`${section} #member-${member.id}`)).toHaveCount(
        1,
      );
      const avatar = card.locator(".avatar");
      const dimensions = await avatar.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          width: box.width,
          height: box.height,
          radius: style.borderRadius,
          overflow: style.overflow,
        };
      });
      expect(dimensions.width).toBe(dimensions.height);
      expect(dimensions.radius).toBe("50%");
      expect(dimensions.overflow).toBe("hidden");
      if (member.photo) {
        await expect(avatar.locator("img")).toHaveAttribute(
          "src",
          site.config.base + member.photo.src.slice(1),
        );
      } else {
        const fallback =
          member.avatarFallback ?? site.config.people.avatarFallback;
        const svg = avatar.getByRole("img", {
          name: localized(fallback.alt, locale),
          exact: true,
        });
        await expect(svg).toHaveAttribute("viewBox", fallback.viewBox);
        // External image documents isolate the original SVG styles from each other.
        await expect(svg.locator("image")).toHaveAttribute(
          "href",
          site.config.base + fallback.src.slice(1),
        );
        await expect(svg.locator("style, path, text")).toHaveCount(0);
      }
    }
  }
});
