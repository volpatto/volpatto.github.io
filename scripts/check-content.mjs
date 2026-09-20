import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { contentSources, projectRoot } from "./lib/content.mjs";
import { contentFiles } from "../src/content/schema.ts";
import { readContent } from "../src/content/reader.ts";

function checkFiles(value, location) {
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (key === "file" && typeof item === "string") {
      const publicRoot = resolve(projectRoot, "public");
      const path = resolve(publicRoot, item.split(/[?#]/)[0]);
      if (!path.startsWith(publicRoot + sep) || !existsSync(path)) {
        throw new Error(
          `${location}.file: arquivo não encontrado em public/: ${item}`,
        );
      }
    } else checkFiles(item, `${location}.${key}`);
  }
}

try {
  const content = readContent(contentSources());
  for (const [key, value] of Object.entries(content))
    checkFiles(value, contentFiles[key]);
  console.log(
    `OK: ${Object.keys(content).length} arquivos YAML; campos, traduções, links e arquivos locais válidos.`,
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
