import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseDocument } from "htmlparser2";
import {
  analyzeGenealogy,
  genealogyGraph,
  loadGenealogy,
} from "../build/genealogy.mjs";

const directory = resolve(process.env.BUILD_DIR ?? "dist", "files/genealogy");
const localized = (value, locale) =>
  typeof value === "string" ? value : value[locale];
const sorted = (values) => [...values].sort();
const edgeKey = (edge) => `${edge.from}->${edge.to}`;
const normalizeWhitespace = (value) => value.replace(/\s+/gu, " ").trim();

function fixture() {
  const ids = [
    "student",
    "advisor",
    "older",
    "founder",
    "alternate",
    "sibling",
    "nephew",
  ];
  return {
    root: "student",
    people: ids.map((id) => ({
      id,
      name: id,
      contribution: { pt: "Mecânica", en: "Mechanics" },
    })),
    sources: [
      {
        id: "record",
        url: "https://example.org/record",
        note: { pt: "Registro", en: "Record" },
      },
    ],
    // The longer founder route comes first: distances must still use the shortest route.
    edges: [
      ["advisor", "student"],
      ["older", "advisor"],
      ["founder", "older"],
      ["alternate", "student"],
      ["founder", "alternate"],
      ["advisor", "sibling"],
      ["sibling", "nephew"],
    ].map(([from, to]) => ({
      from,
      to,
      kind: "doctoral",
      sources: ["record"],
    })),
  };
}

function* elements(node) {
  if (node.attribs) yield node;
  for (const child of node.children ?? []) yield* elements(child);
}

function textContent(node) {
  return node.type === "text"
    ? node.data
    : (node.children ?? []).map(textContent).join("");
}

const childTitle = (node) =>
  textContent(node.children.find((child) => child.name === "title"));

test("genealogy separates directed ancestry from undirected shortest distances", () => {
  const original = fixture();
  const before = structuredClone(original);
  const data = analyzeGenealogy(original);
  assert.deepEqual(
    Object.fromEntries(
      data.people.map((person) => [person.id, person.distance]),
    ),
    {
      student: 0,
      advisor: 1,
      older: 2,
      founder: 2,
      alternate: 1,
      sibling: 2,
      nephew: 3,
    },
  );
  assert.deepEqual(
    sorted(
      data.people
        .filter((person) => person.ancestor)
        .map((person) => person.id),
    ),
    sorted(["advisor", "older", "founder", "alternate"]),
  );
  assert.equal(
    data.people.find((person) => person.id === data.root).ancestor,
    false,
  );
  assert.deepEqual(
    original,
    before,
    "analysis does not mutate the evidence dataset",
  );
});

test("genealogy rejects cycles, missing evidence and disconnected or ambiguous records", async (t) => {
  const cases = [
    [
      "directed cycle",
      (data) =>
        data.edges.push({
          from: "student",
          to: "founder",
          kind: "doctoral",
          sources: ["record"],
        }),
      /cycle/,
    ],
    [
      "unknown source",
      (data) => data.edges[0].sources.push("missing"),
      /evidence/,
    ],
    ["missing evidence", (data) => (data.edges[0].sources = []), /evidence/],
    [
      "unknown relationship type",
      (data) => (data.edges[0].kind = "inferred"),
      /relationship type/,
    ],
    [
      "unknown person",
      (data) => (data.edges[0].from = "missing"),
      /invalid.*edge/,
    ],
    [
      "self-link",
      (data) => (data.edges[0].from = data.edges[0].to),
      /invalid.*edge/,
    ],
    [
      "duplicate edge",
      (data) => data.edges.push(structuredClone(data.edges[0])),
      /duplicate edge/,
    ],
    [
      "duplicate person",
      (data) => data.people.push(structuredClone(data.people[0])),
      /duplicate person/,
    ],
    [
      "duplicate source",
      (data) => data.sources.push(structuredClone(data.sources[0])),
      /duplicate person or source/,
    ],
    ["unknown root", (data) => (data.root = "missing"), /unknown root/],
    [
      "disconnected person",
      (data) =>
        (data.edges = data.edges.filter((edge) => edge.to !== "nephew")),
      /disconnected/,
    ],
    [
      "insecure source",
      (data) => (data.sources[0].url = "http://example.org/record"),
      /HTTPS/,
    ],
    [
      "missing translation",
      (data) => delete data.people[0].contribution.en,
      /missing en contribution/,
    ],
  ];
  for (const [name, mutate, expected] of cases) {
    await t.test(name, () => {
      const data = fixture();
      mutate(data);
      assert.throws(() => analyzeGenealogy(data), expected);
    });
  }
});

test("documented genealogy retains the audited distances and disputed Föppl links", async () => {
  const data = await loadGenealogy();
  const people = new Map(data.people.map((person) => [person.id, person]));
  const expectedDistances = {
    volpatto: 0,
    loula: 1,
    bevilacqua: 2,
    lee: 3,
    timoshenko: 4,
    prandtl: 5,
    foppl: 6,
    gauss: 10,
    euler: 12,
    feynman: 12,
  };
  assert.equal(data.root, "volpatto");
  for (const [id, distance] of Object.entries(expectedDistances)) {
    assert.equal(
      people.get(id)?.distance,
      distance,
      `${id}: distance within this documented graph`,
    );
  }
  for (const id of [
    "loula",
    "bevilacqua",
    "lee",
    "timoshenko",
    "prandtl",
    "foppl",
    "gauss",
    "euler",
  ])
    assert.equal(
      people.get(id)?.ancestor,
      true,
      `${id}: ancestor along directed edges`,
    );
  assert.equal(
    people.get("feynman")?.ancestor,
    false,
    "Feynman belongs to a collateral branch",
  );
  for (const from of ["klein", "bruns"])
    assert.equal(
      data.edges.find((edge) => edge.from === from && edge.to === "foppl")
        ?.kind,
      "disputed",
      `${from}–Föppl retains its evidence caveat`,
    );
  assert.equal(
    data.edges.find(
      (edge) => edge.from === "prandtl" && edge.to === "timoshenko",
    )?.kind,
    "historical",
  );
  assert.equal(
    data.edges.find((edge) => edge.from === "foppl" && edge.to === "prandtl")
      ?.kind,
    "historical",
  );
});

test("the diagram projects exactly the documented people, directions and relationship kinds", async () => {
  const data = await loadGenealogy();
  for (const locale of ["pt", "en"]) {
    const graph = genealogyGraph(data, locale);
    assert.equal(graph.directed, true);
    assert.deepEqual(
      sorted(graph.nodes.map((node) => node.name)),
      sorted(data.people.map((person) => person.id)),
    );
    assert.deepEqual(
      sorted(graph.edges.map((edge) => `${edge.tail}->${edge.head}`)),
      sorted(data.edges.map(edgeKey)),
    );
    const styles = {
      doctoral: "solid",
      historical: "dashed",
      disputed: "dotted",
    };
    for (const edge of data.edges) {
      const projected = graph.edges.find(
        (item) => item.tail === edge.from && item.head === edge.to,
      );
      assert.equal(
        projected.attributes.style,
        styles[edge.kind],
        `${edgeKey(edge)}: visually distinguishes the evidence category`,
      );
    }
  }
});

for (const locale of ["pt", "en"]) {
  test(`${locale}: built JSON and SVG preserve the same graph, localization and explanatory notes`, async () => {
    const data = await loadGenealogy();
    const json = JSON.parse(
      await readFile(
        join(directory, `academic-genealogy-${locale}.json`),
        "utf8",
      ),
    );
    const svg = await readFile(
      join(directory, `academic-genealogy-${locale}.svg`),
      "utf8",
    );
    assert.equal(json.locale, locale);
    assert.equal(json.root, data.root);
    assert.equal(json.license, "CC BY 4.0");
    assert.deepEqual(
      json.edges,
      data.edges,
      "export keeps relationship types and evidence references",
    );
    assert.deepEqual(
      json.people,
      data.people.map((person) => ({
        ...person,
        contribution: localized(person.contribution, locale),
      })),
    );
    assert.deepEqual(
      json.sources,
      data.sources.map((source) => ({
        ...source,
        note: localized(source.note, locale),
      })),
    );
    assert(
      json.interpretation?.trim(),
      "download includes an interpretation caveat",
    );

    const nodes = [...elements(parseDocument(svg, { xmlMode: true }))];
    const svgNode = nodes.find((node) => node.name === "svg");
    assert(svgNode, "standalone SVG document");
    assert.equal(svgNode.attribs["xml:lang"], locale);
    assert.equal(svgNode.attribs.role, "img");
    const labelledBy = svgNode.attribs["aria-labelledby"]?.split(/\s+/) ?? [];
    assert(labelledBy.length >= 2, "accessible title and description");
    for (const id of labelledBy) {
      const label = nodes.find((node) => node.attribs.id === id);
      assert(
        label && textContent(label).trim(),
        `accessible label ${id} resolves`,
      );
    }
    const description = nodes.find((node) => node.name === "desc");
    assert(description && textContent(description).trim());
    // These names identify the historical caveats, without fixing their wording.
    for (const name of ["Föppl", "Klein", "Bruns", "Euler", "Lagrange"])
      assert(
        textContent(description).includes(name),
        `${name}: caveat remains available to assistive technology`,
      );
    const graphText = nodes
      .filter((node) => node.name === "text")
      .map(textContent)
      .join("\n");
    for (const line of genealogyGraph(data, locale)
      .graphAttributes.label.split("\n")
      .filter(Boolean))
      assert(
        normalizeWhitespace(graphText).includes(normalizeWhitespace(line)),
        "visible legend and caveats are preserved in the standalone download",
      );
    const groups = nodes.filter((node) => node.name === "g");
    assert.deepEqual(
      sorted(
        groups.filter((node) => node.attribs.class === "node").map(childTitle),
      ),
      sorted(json.people.map((person) => person.id)),
    );
    assert.deepEqual(
      sorted(
        groups.filter((node) => node.attribs.class === "edge").map(childTitle),
      ),
      sorted(json.edges.map(edgeKey)),
    );
  });

  test(`${locale}: the downloadable SVG is self-contained and has no active content`, async () => {
    const svg = await readFile(
      join(directory, `academic-genealogy-${locale}.svg`),
      "utf8",
    );
    assert.doesNotMatch(svg, /<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i);
    const nodes = [...elements(parseDocument(svg, { xmlMode: true }))];
    const identifiers = new Set(
      nodes.map((node) => node.attribs.id).filter(Boolean),
    );
    const forbidden = new Set([
      "script",
      "style",
      "foreignobject",
      "iframe",
      "object",
      "embed",
      "image",
      "animate",
      "animatemotion",
      "animatetransform",
      "set",
    ]);
    for (const node of nodes) {
      assert(
        !forbidden.has(node.name.toLowerCase()),
        `unexpected active or resource-loading element: ${node.name}`,
      );
      for (const [name, value] of Object.entries(node.attribs)) {
        assert(!/^on/i.test(name), `event handler ${name}`);
        if (/^(?:href|xlink:href|src)$/i.test(name)) {
          assert(
            value.startsWith("#") && identifiers.has(value.slice(1)),
            `only resolvable document-local references: ${value}`,
          );
        }
        for (const [, resource] of value.matchAll(
          /url\(\s*["']?([^\s)"']+)["']?\s*\)/gi,
        ))
          assert(
            resource.startsWith("#") && identifiers.has(resource.slice(1)),
            `external resource: ${resource}`,
          );
      }
    }
  });
}
