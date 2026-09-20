import { Marked, Renderer } from "marked";
import { resolveLink } from "./links.ts";

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Inline Markdown only: the Astro template still owns paragraphs and page layout. */
export function renderInline(text: string, base = "/"): string {
  const renderer = new Renderer();
  renderer.link = function ({ href, title, tokens }) {
    const url = escapeAttribute(resolveLink(href, base));
    const titleAttribute = title ? ` title="${escapeAttribute(title)}"` : "";
    return `<a href="${url}"${titleAttribute}>${this.parser.parseInline(tokens)}</a>`;
  };
  renderer.html = () => {
    throw new Error(
      "Use Markdown para os links e a formatação; HTML não é aceito neste campo.",
    );
  };
  renderer.image = () => {
    throw new Error(
      "Cadastre imagens no campo próprio da página, com descrição e dimensões.",
    );
  };
  return new Marked({ renderer, gfm: false, breaks: false }).parseInline(text, {
    async: false,
  });
}
