import { defineConfig } from "astro/config";
import sciastro from "sciastro";

// Content, theme, languages and deployment defaults are in sciastro.yaml.
// SITE_URL and BASE_PATH override the deployment destination at build time.
export default defineConfig({
  integrations: [sciastro({ styles: ["./styles/site.css"] })],
  devToolbar: { enabled: false },
});
