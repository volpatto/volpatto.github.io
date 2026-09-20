import assert from "node:assert/strict";
import { test } from "node:test";
import { parse, stringify } from "yaml";
import { readContent } from "../src/content/reader.ts";
import { contentSources } from "../scripts/lib/content.mjs";
import { renderInline } from "../src/content/markdown.ts";
import { resolveLink, withBase } from "../src/content/links.ts";

function edit(file: string, change: (document: any) => void) {
  const sources = contentSources();
  const document = parse(sources[file]);
  change(document);
  sources[file] = stringify(document);
  return sources;
}

test("missing translation reports the editable file and exact field", () => {
  const sources = edit(
    "conteudo/paginas/pesquisa.yaml",
    (doc) => delete doc.items[0].description.en,
  );
  assert.throws(
    () => readContent(sources),
    /pesquisa\.yaml:[\s\S]*items\.0\.description\.en/,
  );
});

test("misspelled fields and duplicate YAML keys are not silently ignored", () => {
  assert.throws(
    () =>
      readContent(
        edit("conteudo/paginas/contato.yaml", (doc) => {
          doc.adress = doc.address;
        }),
      ),
    /contato\.yaml/,
  );
  const sources = contentSources();
  sources["conteudo/site.yaml"] += "\nprofile: {}\n";
  assert.throws(() => readContent(sources), /site\.yaml[\s\S]*unique/);
});

test("a publication can be added using YAML alone; duplicates are rejected", () => {
  const before = readContent(contentSources());
  const sources = edit("conteudo/paginas/publicacoes.yaml", (doc) => {
    doc.items.push({
      ...doc.items[0],
      title: "Example for this test",
      year: 2027,
      doi: "10.1234/test-2027",
    });
  });
  const after = readContent(sources);
  assert.equal(
    after.publications.items.length,
    before.publications.items.length + 1,
  );
  assert.equal(after.publications.items.at(-1)?.year, "2027");
  assert.throws(
    () =>
      readContent(
        edit("conteudo/paginas/publicacoes.yaml", (doc) =>
          doc.items.push(doc.items[0]),
        ),
      ),
    /doi: Valor repetido/,
  );
});

test("optional supervision topics and software logos can be omitted", () => {
  const sources = edit("conteudo/paginas/software.yaml", (doc) => {
    delete doc.items[0].logo;
    doc.items[0].packages.push({
      label: "Example",
      url: "https://example.org/package",
    });
  });
  const software = readContent(sources).software.items[0];
  assert.equal(software.logo, undefined);
  assert.equal(software.packages.at(-1)?.label, "Example");
  assert.doesNotThrow(() =>
    readContent(
      edit("conteudo/paginas/orientacoes.yaml", (doc) => {
        doc.students.push({
          name: "Example",
          institution: "LNCC",
          year: 2027,
          role: { pt: "Orientação", en: "Supervisor" },
        });
      }),
    ),
  );
});

test("page paths cannot collide between languages or pages", () => {
  assert.throws(
    () =>
      readContent(
        edit("conteudo/paginas/pesquisa.yaml", (doc) => {
          doc.page.path.en = doc.page.path.pt;
        }),
      ),
    /Caminho de página repetido/,
  );
});

test("links and files work at the domain root and under an LNCC subdirectory", () => {
  for (const base of ["/", "/pesquisadores/diego/", "/pesquisadores/diego"]) {
    const prefix = base === "/" ? "" : "/pesquisadores/diego";
    assert.equal(
      withBase("images/photo.jpg", base),
      `${prefix}/images/photo.jpg`,
    );
    assert.equal(
      resolveLink("/en/research/#sciml", base),
      `${prefix}/en/research/#sciml`,
    );
    assert.equal(
      resolveLink("https://example.org/path", base),
      "https://example.org/path",
    );
    assert.equal(
      resolveLink("mailto:diego@example.org", base),
      "mailto:diego@example.org",
    );
    assert.equal(resolveLink("#sciml", base), "#sciml");
    assert.equal(
      renderInline("Veja o [currículo](/curriculo/) e **pesquisa**.", base),
      `Veja o <a href="${prefix}/curriculo/">currículo</a> e <strong>pesquisa</strong>.`,
    );
  }
});

test("Markdown preserves scientific text and rejects executable links and HTML", () => {
  assert.equal(
    renderInline("CO₂, ΔG < 0 e `x_i` & y."),
    "CO₂, ΔG &lt; 0 e <code>x_i</code> &amp; y.",
  );
  for (const value of [
    "[link](javascript:alert%281%29)",
    "[link](//example.org)",
    '<img src=x onerror="alert(1)">',
    "![imagem](/photo.jpg)",
  ]) {
    assert.throws(() => renderInline(value));
  }
  assert.throws(
    () =>
      readContent(
        edit("conteudo/paginas/software.yaml", (doc) => {
          doc.practices.paragraphs[0].pt = "[link](javascript:alert%281%29)";
        }),
      ),
    /software\.yaml:[\s\S]*practices\.paragraphs\.0\.pt/,
  );
});
