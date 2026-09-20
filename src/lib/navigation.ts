import { content, type Language, type PageId } from "../content";
import { resolveLink, withBase } from "../content/links";
export type { PageId } from "../content";

// Presentation order; labels, paths and metadata live in each page's YAML file.
export const pages = [
  content.home.page,
  content.research.page,
  content.publications.page,
  content.software.page,
  content.teaching.page,
  content.people.page,
  content.groups.page,
  content.collaborations.page,
  content.cv.page,
  content.contact.page,
];
export const sitePages = [...pages, content.licensing.page];

export const asset = (path: string) => withBase(path, import.meta.env.BASE_URL);
export const href = (url: string) => resolveLink(url, import.meta.env.BASE_URL);
export const pageUrl = (page: PageId, lang: Language) =>
  asset(content[page].page.path[lang]);
export const pageLabel = (page: PageId, lang: Language) =>
  content[page].page.label[lang];

export const navIcons = {
  home: "user",
  research: "flask",
  publications: "book",
  software: "code",
  teaching: "teaching",
  people: "users",
  groups: "network",
  collaborations: "link",
  cv: "file",
  contact: "mail",
  licensing: "file",
} as const;
