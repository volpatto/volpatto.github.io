import { defineConfig } from "astro/config";

// Change these two values (or environment variables) when moving to LNCC.
export default defineConfig({
  site: process.env.SITE_URL || "https://volpatto.github.io",
  base: process.env.BASE_PATH ?? "/personal-website",
  output: "static",
  trailingSlash: "always",
  devToolbar: { enabled: false },
});
