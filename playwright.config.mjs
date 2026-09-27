import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";
import { loadSite } from "sciastro";

const site = await loadSite(resolve("sciastro.yaml"), {
  url: process.env.SITE_URL,
  base: process.env.BASE_PATH,
});

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.spec.mjs",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  timeout: 60000,
  outputDir: ".test-output/browser",
  reporter: [
    ["list"],
    ["html", { outputFolder: ".test-output/report", open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4370",
    browserName: "chromium",
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    // Foreground server owned by Playwright, independent of the author's preview.
    command:
      "pnpm exec astro preview --host 127.0.0.1 --port 4370 --ignore-lock",
    url: "http://127.0.0.1:4370" + site.config.base,
    reuseExistingServer: false,
  },
});
