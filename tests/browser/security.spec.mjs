import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { loadSite } from "sciastro";

const site = await loadSite(resolve("sciastro.yaml"), {
  url: process.env.SITE_URL,
  base: process.env.BASE_PATH,
});
const research = site.pages.find(
  (page) => page.id === "research" && page.locale === "pt",
);
const pages = [...site.pages, { path: `${site.config.base}404.html` }];

// Observe browser enforcement before any page content is parsed. These tests
// cover the local CSP, not Google Safe Browsing's independent classification.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__cspViolations.push({
        directive: event.effectiveDirective,
        blockedURI: event.blockedURI,
        disposition: event.disposition,
      });
    });
  });
});

const violations = (page) => page.evaluate(() => window.__cspViolations);

async function expectBlocked(page, directives, blockedURI) {
  // Browsers may redact the path of a cross-origin blocked URL in this event.
  const blockedURIs =
    blockedURI === "inline"
      ? [blockedURI]
      : [blockedURI, new URL(blockedURI).origin];
  await expect
    .poll(() =>
      page.evaluate(
        ({ directives, blockedURIs }) =>
          window.__cspViolations.some(
            (event) =>
              directives.includes(event.directive) &&
              event.disposition === "enforce" &&
              blockedURIs.includes(event.blockedURI),
          ),
        { directives, blockedURIs },
      ),
    )
    .toBe(true);
}

for (const record of pages) {
  test(`${record.path}: CSP permits normal rendering and all images`, async ({
    page,
  }) => {
    await page.goto(record.path);
    await expect(
      page.locator('meta[http-equiv="Content-Security-Policy" i]'),
    ).toHaveCount(1);
    expect(
      await page.evaluate(() => {
        const policy = document.querySelector(
          'meta[http-equiv="Content-Security-Policy" i]',
        );
        return [...document.querySelectorAll("script, style")].every(
          (element) =>
            Boolean(
              policy.compareDocumentPosition(element) &
              Node.DOCUMENT_POSITION_FOLLOWING,
            ),
        );
      }),
      "CSP is parsed before every script and style block",
    ).toBe(true);
    await expect(page.locator("h1")).toHaveCount(1);

    const failedImages = await page.evaluate(async () => {
      const images = [...document.images];
      // Lazy figures below the viewport must also exercise img-src.
      images.forEach((image) => {
        image.loading = "eager";
      });
      // SVG <image> has no naturalWidth/decode API. Probe its actual href with
      // the same browser image loader and CSP instead of omitting those logos.
      for (const element of document.querySelectorAll("svg image")) {
        const image = new Image();
        image.src = element.href.baseVal;
        images.push(image);
      }
      const results = await Promise.all(
        images.map(async (image) => {
          try {
            await image.decode();
            return image.complete && image.naturalWidth > 0
              ? null
              : image.currentSrc || image.src;
          } catch {
            return image.currentSrc || image.src;
          }
        }),
      );
      await document.fonts.ready;
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      return results.filter((result) => result !== null);
    });

    expect(failedImages).toEqual([]);
    expect(await violations(page)).toEqual([]);
  });
}

test("CSP permits the theme toggle and its saved preference", async ({
  page,
}) => {
  await page.goto(research.path);
  const toggle = page.locator(".theme-toggle");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await violations(page)).toEqual([]);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(await violations(page)).toEqual([]);
});

test("CSP blocks unauthorized code and connections on Pesquisa", async ({
  page,
}) => {
  const blockedOrigin = "https://blocked.invalid";
  const externalScript = `${blockedOrigin}/security-probe.js`;
  const connection = `${blockedOrigin}/security-probe.json`;
  const dispatchedRequests = [];
  // Even if the policy regresses, these probes receive local mock responses
  // and never contact an external server. CSP must stop them before routing.
  await page.route(`${blockedOrigin}/**`, async (route) => {
    dispatchedRequests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType:
        route.request().url() === externalScript
          ? "application/javascript"
          : "application/json",
      headers: { "access-control-allow-origin": "*" },
      body:
        route.request().url() === externalScript
          ? "window.__cspExternalProbeExecuted = true;"
          : '{"probe":"reached"}',
    });
  });
  await page.goto(research.path);
  expect(await violations(page)).toEqual([]);

  await test.step("unhashed inline script", async () => {
    await page.evaluate(() => {
      const script = document.createElement("script");
      script.textContent = "window.__cspInlineProbeExecuted = true;";
      document.body.append(script);
    });
    await expectBlocked(page, ["script-src-elem", "script-src"], "inline");
    expect(
      await page.evaluate(() => window.__cspInlineProbeExecuted),
    ).toBeUndefined();
  });

  await test.step("inline event handler", async () => {
    await page.evaluate(() => {
      const button = document.createElement("button");
      button.id = "csp-handler-probe";
      button.textContent = "CSP handler probe";
      button.setAttribute(
        "onclick",
        "window.__cspHandlerProbeExecuted = true;",
      );
      document.body.append(button);
    });
    await page.locator("#csp-handler-probe").click();
    await expectBlocked(page, ["script-src-attr", "script-src"], "inline");
    expect(
      await page.evaluate(() => window.__cspHandlerProbeExecuted),
    ).toBeUndefined();
  });

  await test.step("external script", async () => {
    const outcome = await page.evaluate(
      (url) =>
        new Promise((resolve) => {
          const script = document.createElement("script");
          script.onload = () => resolve("loaded");
          script.onerror = () => resolve("blocked");
          script.src = url;
          document.head.append(script);
        }),
      externalScript,
    );
    expect(outcome).toBe("blocked");
    await expectBlocked(
      page,
      ["script-src-elem", "script-src"],
      externalScript,
    );
    expect(
      await page.evaluate(() => window.__cspExternalProbeExecuted),
    ).toBeUndefined();
    expect(dispatchedRequests).toEqual([]);
  });

  await test.step("outgoing fetch", async () => {
    const outcome = await page.evaluate(async (url) => {
      try {
        await fetch(url);
        return "connected";
      } catch {
        return "blocked";
      }
    }, connection);
    expect(outcome).toBe("blocked");
    await expectBlocked(page, ["connect-src"], connection);
    expect(dispatchedRequests).toEqual([]);
  });
});
