import { defineConfig } from "astro/config";
import sciastro from "sciastro";
import secureStaticHTML from "./build/security.mjs";

// Content, theme, languages and deployment defaults are in sciastro.yaml.
// SITE_URL and BASE_PATH override the deployment destination at build time.
export default defineConfig({
  integrations: [
    sciastro({ styles: ["./styles/site.css"] }),
    secureStaticHTML(),
  ],
  devToolbar: { enabled: false },
  security: {
    // Astro embeds this policy in the generated HTML, including on GitHub Pages.
    // This static site needs no forms, embeds, workers or background connections.
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'none'",
        "form-action 'none'",
        "object-src 'none'",
        "frame-src 'none'",
        "worker-src 'none'",
        "connect-src 'none'",
        "img-src 'self' data:",
        // Vite embeds small font subsets directly in the generated stylesheet.
        "font-src 'self' data:",
      ],
      scriptDirective: {
        resources: [
          { resource: "'self'", kind: "element" },
          { resource: "'none'", kind: "attribute" },
        ],
      },
      styleDirective: {
        resources: [
          { resource: "'self'", kind: "element" },
          // SciAstro uses style attributes for figure sizing and positioning.
          { resource: "'unsafe-inline'", kind: "attribute" },
        ],
      },
    },
  },
});
