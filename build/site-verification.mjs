import { readFile, writeFile } from "node:fs/promises";

// Google checks the published homepage HTML, without running JavaScript.
export default function googleSiteVerification(token) {
  if (!/^[A-Za-z0-9_-]+$/.test(token)) {
    throw new Error("Invalid Google site verification token");
  }
  return {
    name: "google-site-verification",
    hooks: {
      "astro:build:done": async ({ dir }) => {
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
