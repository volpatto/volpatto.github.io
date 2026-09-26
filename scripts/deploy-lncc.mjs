import { spawnSync } from "node:child_process";
import { lstat, mkdtemp, readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectDirectory = fileURLToPath(new URL("../", import.meta.url));
const siteURL = "https://www.lncc.br/~volpatto/";

function rsync(args) {
  const result = spawnSync("rsync", args, { encoding: "utf8" });
  if (result.error?.code === "ENOENT") {
    throw new Error("Instale rsync nesta máquina para publicar no LNCC.");
  }
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `rsync falhou (${result.status ?? result.signal}): ${result.stderr.trim()}`,
    );
  }
  return result.stdout;
}

// The Pixi task runs build-lncc first and stops if any build check fails.
export async function publishLNCC(projectRoot = projectDirectory) {
  const source = resolve(projectRoot, "dist");
  const destination = resolve(projectRoot, "../htdocs");
  for (const directory of [source, destination]) {
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new Error(
        `Esperado um diretório real, sem link simbólico: ${directory}`,
      );
    }
  }

  const [html, apache, errorPage] = await Promise.all([
    readFile(resolve(source, "index.html"), "utf8"),
    readFile(resolve(source, ".htaccess"), "utf8"),
    readFile(resolve(source, "404.html"), "utf8"),
  ]);
  if (
    !/<link\b(?=[^>]*\brel="canonical")(?=[^>]*\bhref="https:\/\/www\.lncc\.br\/~volpatto\/")[^>]*>/.test(
      html,
    ) ||
    !/^AddDefaultCharset UTF-8\s*$/m.test(apache) ||
    !/^ErrorDocument 404 \/~volpatto\/404\.html\s*$/m.test(apache) ||
    !errorPage.trim()
  ) {
    throw new Error(
      "Build incompatível com o LNCC. Execute pixi run --locked deploy-lncc.",
    );
  }

  const usage = rsync(["--help"]);
  for (const option of ["--delay-updates", "--delete-delay", "--chmod"]) {
    if (!usage.includes(option)) {
      throw new Error(`Atualize o rsync: a publicação requer ${option}.`);
    }
  }
  const timestamp = new Date().toISOString().replaceAll(/[-:.]/g, "");
  const backup = await mkdtemp(`${destination}.backup-${timestamp}-`);
  // A failed backup must never be followed by a change to the published site.
  rsync(["-a", "--", destination + sep, backup + sep]);
  try {
    rsync([
      "-a",
      "--delay-updates",
      "--delete-delay",
      "--chmod=D755,F644",
      "--",
      source + sep,
      destination + sep,
    ]);
  } catch (error) {
    throw new Error(`${error.message}\nBackup da versão anterior: ${backup}`, {
      cause: error,
    });
  }
  return { destination, backup };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const { destination, backup } = await publishLNCC();
    console.log(
      `Publicado em ${destination}\nSite: ${siteURL}\nBackup: ${backup}`,
    );
  } catch (error) {
    console.error(`Publicação não concluída: ${error.message}`);
    process.exitCode = 1;
  }
}
