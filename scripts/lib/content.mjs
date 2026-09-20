import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { contentFiles } from "../../src/content/schema.ts";
import { readContent } from "../../src/content/reader.ts";

export const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
export function contentSources() {
  return Object.fromEntries(
    Object.values(contentFiles).map((file) => [
      file,
      readFileSync(new URL(`../../${file}`, import.meta.url), "utf8"),
    ]),
  );
}
export function loadContent() {
  return readContent(contentSources());
}
