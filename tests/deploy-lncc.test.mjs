import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { publishLNCC } from "../scripts/deploy-lncc.mjs";

const rsyncHelp = spawnSync("rsync", ["--help"], { encoding: "utf8" });
const hasRsync = ["--delay-updates", "--delete-delay", "--chmod"].every(
  (option) => rsyncHelp.stdout?.includes(option),
);
const page =
  '<html><head><link rel="canonical" href="https://www.lncc.br/~volpatto/"></head><body>Novo site: ciência.</body></html>';
const apache =
  "AddDefaultCharset UTF-8\nErrorDocument 404 /~volpatto/404.html\n";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "lncc-deploy-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = join(root, "project");
  const source = join(project, "dist");
  const destination = join(root, "htdocs");
  await mkdir(join(source, "_astro"), { recursive: true });
  await mkdir(destination);
  await Promise.all([
    writeFile(join(source, "index.html"), page),
    writeFile(join(source, ".htaccess"), apache),
    writeFile(join(source, "404.html"), "Página não encontrada."),
    writeFile(join(source, "_astro", "site.css"), "body { color: black; }"),
    writeFile(join(destination, "index.html"), "Versão anterior."),
    writeFile(join(destination, ".htaccess"), "Configuração anterior."),
    writeFile(join(destination, "obsolete.txt"), "Arquivo antigo."),
  ]);
  return { root, project, source, destination };
}

test(
  "LNCC deployment backs up the old site, publishes hidden files and removes stale assets",
  {
    skip: !hasRsync && "a compatible rsync is required only for deployment",
  },
  async (t) => {
    const { root, project, source, destination } = await fixture(t);
    await chmod(join(source, "index.html"), 0o777);
    await chmod(join(source, "_astro"), 0o777);
    const { backup } = await publishLNCC(project);
    assert.equal(
      dirname(backup),
      root,
      "backup stays outside the public directory",
    );
    assert.equal(
      await readFile(join(backup, "index.html"), "utf8"),
      "Versão anterior.",
    );
    assert.equal(
      await readFile(join(backup, ".htaccess"), "utf8"),
      "Configuração anterior.",
    );
    assert.equal(
      await readFile(join(backup, "obsolete.txt"), "utf8"),
      "Arquivo antigo.",
    );
    assert.equal(await readFile(join(destination, "index.html"), "utf8"), page);
    assert.equal(
      await readFile(join(destination, ".htaccess"), "utf8"),
      apache,
    );
    assert.equal(
      await readFile(join(destination, "_astro", "site.css"), "utf8"),
      "body { color: black; }",
    );
    await assert.rejects(stat(join(destination, "obsolete.txt")), {
      code: "ENOENT",
    });
    if (process.platform !== "win32") {
      assert.equal(
        (await stat(join(destination, "index.html"))).mode & 0o777,
        0o644,
      );
      assert.equal(
        (await stat(join(destination, "_astro"))).mode & 0o777,
        0o755,
      );
    }
  },
);

for (const invalid of ["GitHub Pages build", "missing Apache configuration"]) {
  test(`LNCC deployment leaves the published site intact with ${invalid}`, async (t) => {
    const { root, project, source, destination } = await fixture(t);
    if (invalid === "GitHub Pages build") {
      await writeFile(
        join(source, "index.html"),
        page.replace(
          "https://www.lncc.br/~volpatto/",
          "https://volpatto.github.io/",
        ),
      );
    } else {
      await rm(join(source, ".htaccess"));
    }
    await assert.rejects(publishLNCC(project));
    assert.equal(
      await readFile(join(destination, "index.html"), "utf8"),
      "Versão anterior.",
    );
    assert.equal(
      await readFile(join(destination, ".htaccess"), "utf8"),
      "Configuração anterior.",
    );
    assert.equal(
      await readFile(join(destination, "obsolete.txt"), "utf8"),
      "Arquivo antigo.",
    );
    assert.deepEqual((await readdir(root)).sort(), ["htdocs", "project"]);
  });
}

test(
  "LNCC deployment refuses a symbolic link as the publication directory",
  {
    skip:
      process.platform === "win32" &&
      "directory symlinks require additional privileges on Windows",
  },
  async (t) => {
    const { root, project, destination } = await fixture(t);
    const outside = join(root, "outside");
    await mkdir(outside);
    await writeFile(join(outside, "keep.txt"), "Preservar.");
    await rm(destination, { recursive: true });
    await symlink(outside, destination, "dir");
    await assert.rejects(publishLNCC(project), /sem link simbólico/);
    assert.equal(
      await readFile(join(outside, "keep.txt"), "utf8"),
      "Preservar.",
    );
  },
);
