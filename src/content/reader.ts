import { parseDocument } from "yaml";
import { contentFiles, schemas, type Content } from "./schema.ts";

/** Shared by Astro and command-line checks; reports the editable file and field. */
export function readContent(sources: Record<string, string>): Content {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(contentFiles) as (keyof Content)[]) {
    const filename = contentFiles[key];
    if (!(filename in sources))
      throw new Error(`Arquivo de conteúdo não encontrado: ${filename}`);
    const document = parseDocument(sources[filename]);
    if (document.errors.length)
      throw new Error(
        `${filename}\n${document.errors.map((error) => error.message).join("\n")}`,
      );
    const parsed = schemas[key].safeParse(document.toJS());
    if (!parsed.success) {
      const details = parsed.error.issues.map(
        (issue) => `  ${issue.path.join(".") || "(raiz)"}: ${issue.message}`,
      );
      throw new Error(`Revise ${filename}:\n${details.join("\n")}`);
    }
    result[key] = parsed.data;
  }
  const content = result as Content;
  const paths = new Set<string>();
  for (const [key, value] of Object.entries(content)) {
    if (!("page" in value)) continue;
    if (value.page.id !== key)
      throw new Error(
        `${contentFiles[key as keyof Content]}: mantenha page.id = ${key}.`,
      );
    for (const path of Object.values(value.page.path)) {
      if (paths.has(path))
        throw new Error(`Caminho de página repetido: /${path}`);
      paths.add(path);
    }
  }
  return content;
}
