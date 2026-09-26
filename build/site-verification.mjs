import { readFile, writeFile } from "node:fs/promises";

// Google checks the published homepage HTML, without running JavaScript.
export default function googleSiteVerification(tokensBySite) {
  for (const token of Object.values(tokensBySite)) {
    if (!/^[A-Za-z0-9_-]+$/.test(token)) {
      throw new Error("Invalid Google site verification token");
    }
  }
  let token;
  return {
    name: "google-site-verification",
    hooks: {
      "astro:config:done": ({ config }) => {
        const base = config.base.endsWith("/")
          ? config.base
          : `${config.base}/`;
        token = tokensBySite[new URL(base, config.site).href];
      },
      "astro:build:done": async ({ dir }) => {
        if (!token) return;
        const homepage = new URL("index.html", dir);
        const html = await readFile(homepage, "utf8");
        if (!html.includes("</head>")) {
          throw new Error(
            "Cannot add Google verification: homepage has no head",
          );
        }
        const tag = `<meta name="google-site-verification" content="${token}">`;
        await writeFile(homepage, html.replace("</head>", `${tag}</head>`));
      },
    },
  };
}
