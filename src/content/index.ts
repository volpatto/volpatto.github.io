import { readContent } from "./reader.ts";
import type { Language, Translation } from "./schema.ts";
export type { Language, Translation, PageId, Content } from "./schema.ts";

// Raw Vite imports make YAML edits update the local preview immediately.
// Parsing runs at build time; no YAML parser or content fetch is sent to browsers.
const sources = import.meta.glob<string>("/conteudo/**/*.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
});
export const content = readContent(
  Object.fromEntries(
    Object.entries(sources).map(([path, source]) => [path.slice(1), source]),
  ),
);
export const profile = content.site.profile;
export const t = (value: Translation, lang: Language): string => value[lang];
