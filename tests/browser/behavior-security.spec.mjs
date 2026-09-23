import { test as base, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { once } from "node:events";
import { resolve } from "node:path";
import { loadSite } from "sciastro";
import { loadSecurityPolicy } from "../../scripts/security-policy.mjs";

const [site, policy] = await Promise.all([
  loadSite(resolve("sciastro.yaml"), {
    url: process.env.SITE_URL,
    base: process.env.BASE_PATH,
  }),
  loadSecurityPolicy(),
]);
const pages = [...site.pages, { path: `${site.config.base}404.html` }];
const pageFor = (id, locale = "pt") =>
  site.pages.find((page) => page.id === id && page.locale === locale);

// Playwright creates a separate context per test. Install the observer before
// creating its first page; it also sees requests from newly opened windows.
const test = base.extend({
  observed: async ({ context, baseURL }, use, info) => {
    const origin = new URL(baseURL).origin;
    const allowedOrigins = new Set([
      origin,
      ...policy.resources.allowedOrigins,
    ]);
    const requests = [];
    const violations = [];
    const documents = new Set();
    const commits = new Set();
    const downloads = new Set();
    const mocks = new Map();
    const pending = [];
    let page;
    const report = (event) => violations.push(event);
    const localURL = (path) => {
      const url = new URL(path, baseURL);
      if (url.origin !== origin) throw new Error("Expected a local action URL");
      return url.href;
    };

    await context.exposeBinding("__reportBrowserSecurity", (_, event) => {
      if (event.kind !== "checkpoint") report(event);
    });
    await context.addInitScript(() => {
      const report = (event) => window.__reportBrowserSecurity(event);
      // Workers have no purpose in this static site. Observe attempts before
      // construction so blob workers cannot run outside request interception.
      for (const name of ["Worker", "SharedWorker"]) {
        if (!(name in window)) continue;
        window[name] = new Proxy(window[name], {
          construct(_, args) {
            void report({ kind: "worker", type: name, url: String(args[0]) });
            throw new DOMException(
              "Worker blocked by security observer",
              "SecurityError",
            );
          },
        });
      }
      if (navigator.serviceWorker) {
        navigator.serviceWorker.register = function (url) {
          void report({
            kind: "worker",
            type: "ServiceWorker",
            url: String(url),
          });
          return Promise.reject(
            new DOMException("Service worker blocked", "SecurityError"),
          );
        };
      }
      document.addEventListener("securitypolicyviolation", (event) => {
        void report({
          kind: "csp",
          directive: event.effectiveDirective,
          url: event.blockedURI,
        });
      });
    });
    await context.routeWebSocket(/.*/, async (socket) => {
      report({ kind: "websocket", url: socket.url() });
      // Never connectToServer: the attempted socket has no remote peer.
      await socket.close();
    });
    context.on("request", (request) => {
      requests.push({ url: request.url(), type: request.resourceType() });
    });
    context.on("page", (opened) => {
      if (page) {
        report({ kind: "popup", url: opened.url() });
        pending.push(opened.close().catch(() => {}));
        return;
      }
      page = opened;
      page.on("framenavigated", (frame) => {
        if (frame.url() === "about:blank") return;
        if (frame !== page.mainFrame() || !commits.delete(frame.url())) {
          report({ kind: "document", url: frame.url() });
        }
      });
      page.on("download", (download) => {
        if (!downloads.delete(download.url())) {
          report({ kind: "download", url: download.url() });
          pending.push(download.cancel().catch(() => {}));
        }
      });
      page.on("worker", (worker) => {
        report({ kind: "worker", type: "DedicatedWorker", url: worker.url() });
        pending.push(worker.evaluate(() => self.close()).catch(() => {}));
      });
    });
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = request.url();
      if (request.isNavigationRequest()) {
        let mainFrame = false;
        // A popup's initial request may precede creation of its Frame object.
        try {
          mainFrame = request.frame() === page.mainFrame();
        } catch {
          // Such requests cannot be an explicitly authorized page action.
        }
        if (!mainFrame || !documents.delete(url)) {
          report({ kind: "navigation", url });
          await route.abort("blockedbyclient");
          return;
        }
        commits.add(url);
      } else if (!allowedOrigins.has(new URL(url).origin)) {
        report({ kind: "request", url, type: request.resourceType() });
        await route.abort("blockedbyclient");
        return;
      }
      const mock = mocks.get(url);
      // Playwright does not re-route each hop after route.continue(). Fetch
      // only the approved URL and reject redirects before following a target.
      // fulfill({ response }) retains status, headers and downloaded bytes.
      const response = mock ? null : await route.fetch({ maxRedirects: 0 });
      const status = mock ? (mock.status ?? 200) : response.status();
      if (status >= 300 && status < 400) {
        const headers = mock ? (mock.headers ?? {}) : response.headers();
        report({
          kind: "redirect",
          url,
          target: headers.location ?? "",
          status,
        });
        await route.abort("blockedbyclient");
      } else {
        await route.fulfill(mock ?? { response });
      }
    });
    await context.newPage();

    const observed = {
      page,
      requests,
      violations,
      mock(path, response) {
        mocks.set(localURL(path), response);
      },
      async goto(path) {
        const url = localURL(path);
        documents.add(url);
        await page.goto(url);
      },
      async navigate(path, action) {
        const url = localURL(path);
        documents.add(url);
        await Promise.all([page.waitForURL(url), action()]);
      },
      expectDownload(path) {
        downloads.add(localURL(path));
      },
      async settle() {
        // Exercise lazy image requests and wait for actual rendering milestones,
        // without claiming coverage of arbitrarily delayed malicious timers.
        await page.evaluate(async () => {
          for (const image of document.images) image.loading = "eager";
          await Promise.all(
            [...document.images].map((image) => image.decode().catch(() => {})),
          );
          await document.fonts.ready;
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          await window.__reportBrowserSecurity({ kind: "checkpoint" });
        });
        await Promise.all(pending);
      },
      async expectQuiet() {
        await this.settle();
        expect(violations, "Unexpected browser activity").toEqual([]);
        expect([...documents], "Expected navigation was requested").toEqual([]);
        expect([...commits], "Expected navigation committed").toEqual([]);
        expect([...downloads], "Expected download occurred").toEqual([]);
      },
    };
    try {
      await use(observed);
    } finally {
      await info.attach("browser-security-activity", {
        body: JSON.stringify({ requests, violations }, null, 2),
        contentType: "application/json",
      });
    }
  },
});
test.use({ serviceWorkers: "block" });

for (const record of pages) {
  test(`${record.path}: no unexpected automatic browser activity`, async ({
    observed,
  }) => {
    await observed.goto(record.path);
    await expect(observed.page.locator("h1")).toHaveCount(1);
    await observed.expectQuiet();
  });
}

test("theme, menu and language actions stay within expected navigation", async ({
  observed,
}, info) => {
  const { page } = observed;
  await observed.goto(pageFor("research").path);
  await page.locator(".theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  if (info.project.name === "mobile") {
    await page.locator(".navigation > summary").click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".navigation")).not.toHaveAttribute("open", "");
  }
  await observed.navigate(pageFor("research", "en").path, () =>
    page.getByRole("link", { name: "English", exact: true }).click(),
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  if (info.project.name === "mobile")
    await page.locator(".navigation > summary").click();
  const software = pageFor("software", "en").path;
  await observed.navigate(software, () =>
    page.locator(`.navigation a[href="${software}"]`).click(),
  );
  await observed.expectQuiet();
});

test("an intentional CV download returns the local PDF", async ({
  observed,
}) => {
  const { page } = observed;
  await observed.goto(pageFor("cv").path);
  const link = page.locator("a[download]");
  const href = await link.getAttribute("href");
  observed.expectDownload(href);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    link.click(),
  ]);
  expect(await download.failure()).toBeNull();
  const content = await readFile(await download.path());
  expect(content.length).toBeGreaterThan(1000);
  expect(content.subarray(0, 5).toString()).toBe("%PDF-");
  expect(content.subarray(-1024).toString()).toContain("%%EOF");
  await observed.expectQuiet();
});

test("observer detects and blocks external requests, popups and automatic downloads", async ({
  observed,
}) => {
  const fixture = `${site.config.base}__behavior_security_probe__/`;
  // This local mock intentionally has no CSP: the sentinel must test the
  // observer itself even when normal pages block these actions earlier.
  observed.mock(fixture, {
    contentType: "text/html",
    body: `<!doctype html><title>Security observer sentinel</title><script>
      fetch("https://blocked.invalid/automatic-probe").catch(() => {});
      window.open("${fixture}popup", "_blank");
      const link = document.createElement("a");
      link.href = "data:text/plain,local-security-sentinel";
      link.download = "security-sentinel.txt";
      link.click();
    </script>`,
  });
  await observed.goto(fixture);
  await expect
    .poll(() => observed.violations.map((event) => event.kind))
    .toEqual(expect.arrayContaining(["request", "popup", "download"]));
  await observed.settle();
  expect(
    observed.requests.filter((request) =>
      request.url.startsWith("https://blocked.invalid/"),
    ),
  ).toHaveLength(1);
});

test("observer blocks unexpected document navigation, workers and sockets", async ({
  observed,
}) => {
  const fixture = `${site.config.base}__behavior_security_primitives__/`;
  observed.mock(fixture, {
    contentType: "text/html",
    body: `<!doctype html><title>Security primitives sentinel</title><script>
      try { new Worker("${fixture}worker.js"); } catch {}
      new WebSocket("wss://blocked.invalid/socket");
    </script>`,
  });
  await observed.goto(fixture);
  await expect
    .poll(() => observed.violations.map((event) => event.kind))
    .toEqual(expect.arrayContaining(["worker", "websocket"]));
  const destination = new URL("unexpected-navigation", observed.page.url())
    .href;
  await observed.page.evaluate((url) => {
    location.href = url;
  }, destination);
  await expect
    .poll(() => observed.violations)
    .toEqual(
      expect.arrayContaining([{ kind: "navigation", url: destination }]),
    );
  expect(
    observed.requests.some((request) => request.url.endsWith("worker.js")),
  ).toBe(false);
});

// Real loopback responses exercise route.fetch's redirect behavior. No external
// destination is contacted even if maxRedirects regresses in a later change.
const redirectTest = test.extend({
  redirectServer: async ({}, use) => {
    let targetHits = 0;
    const target = createServer((_, response) => {
      targetHits++;
      response.writeHead(200, { "content-type": "image/svg+xml" });
      response.end('<svg xmlns="http://www.w3.org/2000/svg"/>');
    });
    target.listen(0, "127.0.0.1");
    await once(target, "listening");
    const destination = `http://127.0.0.1:${target.address().port}/target.svg`;
    const source = createServer((request, response) => {
      if (request.url === "/redirect") {
        response.writeHead(302, { location: destination });
        response.end();
      } else {
        response.writeHead(200, { "content-type": "text/html" });
        response.end(
          '<!doctype html><title>Redirect sentinel</title><img src="/redirect">',
        );
      }
    });
    source.listen(0, "127.0.0.1");
    await once(source, "listening");
    try {
      await use({
        origin: `http://127.0.0.1:${source.address().port}`,
        destination,
        targetHits: () => targetHits,
      });
    } finally {
      await Promise.all(
        [source, target].map(
          (server) =>
            new Promise((resolve) => {
              server.close(resolve);
              server.closeAllConnections();
            }),
        ),
      );
    }
  },
  baseURL: async ({ redirectServer }, use) => use(redirectServer.origin),
});

redirectTest(
  "observer stops an allowed resource redirect before contacting its target",
  async ({ observed, redirectServer }) => {
    await observed.goto("/");
    await expect
      .poll(() => observed.violations)
      .toEqual(
        expect.arrayContaining([
          {
            kind: "redirect",
            url: `${redirectServer.origin}/redirect`,
            target: redirectServer.destination,
            status: 302,
          },
        ]),
      );
    await observed.settle();
    expect(
      observed.requests.some(
        (request) => request.url === redirectServer.destination,
      ),
    ).toBe(false);
    expect(redirectServer.targetHits()).toBe(0);
    expect(
      await observed.page
        .locator("img")
        .evaluate((image) => image.naturalWidth),
    ).toBe(0);
  },
);
