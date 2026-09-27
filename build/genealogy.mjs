import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { parse } from "yaml";

// Astro bundles this module into dist/.prerender; content stays in the project.
const source = resolve("conteudo/genealogia.yaml");
const local = (value, locale) =>
  typeof value === "string" ? value : value[locale];
const xml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Distances belong to this documented, bounded graph, not the entire MGP. */
export function analyzeGenealogy(data) {
  const people = new Map(data.people.map((person) => [person.id, person]));
  const sources = new Map(data.sources.map((item) => [item.id, item]));
  if (
    people.size !== data.people.length ||
    sources.size !== data.sources.length
  )
    throw new Error("Genealogy: duplicate person or source identifier.");
  if (!people.has(data.root)) throw new Error("Genealogy: unknown root.");
  for (const person of people.values()) {
    if (!/^[a-z][a-z0-9-]*$/.test(person.id) || !person.name)
      throw new Error("Genealogy: invalid person identifier or name.");
    for (const locale of ["pt", "en"])
      if (!local(person.contribution, locale))
        throw new Error(
          `Genealogy: missing ${locale} contribution for ${person.id}.`,
        );
  }
  for (const item of sources.values()) {
    if (new URL(item.url).protocol !== "https:")
      throw new Error(`Genealogy: source ${item.id} needs HTTPS.`);
  }
  const neighbours = new Map([...people.keys()].map((id) => [id, []]));
  const mentors = new Map([...people.keys()].map((id) => [id, []]));
  const links = new Set();
  for (const edge of data.edges) {
    const key = `${edge.from}:${edge.to}`;
    if (
      !people.has(edge.from) ||
      !people.has(edge.to) ||
      edge.from === edge.to ||
      links.has(key)
    )
      throw new Error(`Genealogy: invalid or duplicate edge ${key}.`);
    if (
      !["doctoral", "historical", "disputed"].includes(edge.kind) ||
      !edge.sources?.length ||
      edge.sources.some((id) => !sources.has(id))
    )
      throw new Error(
        `Genealogy: missing evidence or relationship type for ${key}.`,
      );
    links.add(key);
    neighbours.get(edge.from).push(edge.to);
    neighbours.get(edge.to).push(edge.from);
    mentors.get(edge.to).push(edge.from);
  }
  // A cycle would turn a person into their own academic ancestor.
  const visiting = new Set(),
    visited = new Set();
  const visit = (id) => {
    if (visiting.has(id))
      throw new Error(`Genealogy: directed cycle at ${id}.`);
    if (visited.has(id)) return;
    visiting.add(id);
    mentors.get(id).forEach(visit);
    visiting.delete(id);
    visited.add(id);
  };
  people.forEach((_, id) => visit(id));
  const distances = new Map([[data.root, 0]]),
    queue = [data.root];
  for (const id of queue)
    for (const next of neighbours.get(id)) {
      if (distances.has(next)) continue;
      distances.set(next, distances.get(id) + 1);
      queue.push(next);
    }
  if (distances.size !== people.size)
    throw new Error("Genealogy: disconnected people.");
  const ancestors = new Set(),
    pending = [...mentors.get(data.root)];
  for (const id of pending) {
    if (ancestors.has(id)) continue;
    ancestors.add(id);
    pending.push(...mentors.get(id));
  }
  return {
    ...data,
    people: data.people.map((person) => ({
      ...person,
      distance: distances.get(person.id),
      ancestor: ancestors.has(person.id),
    })),
  };
}

export async function loadGenealogy(file = source) {
  return analyzeGenealogy(parse(await readFile(file, "utf8")));
}

const labels = {
  pt: {
    title: "Genealogia acadêmica · Diego Tavares Volpatto",
    sub: "Recorte documentado · setas do orientador ou mentor para o aluno",
    distance: "relações",
    one: "relação",
    root: "ponto de partida",
    ancestor: "ascendência",
    collateral: "ramo colateral",
    legend:
      "Linha contínua: orientação registrada   ·   Tracejada: estudo ou mentoria   ·   Pontilhada: atribuição discutida",
    caveat:
      "Distâncias calculadas apenas neste grafo. Ramos que passam por Klein ou Bruns dependem da atribuição discutida de Föppl.",
    caveat2:
      "Euler–Lagrange representa correspondência e influência intelectual. Não é uma cadeia uniforme de doutorados.",
    source:
      "Fontes e notas: consulte os dados JSON e a página do site. Levantamento: setembro de 2026 · CC BY 4.0",
  },
  en: {
    title: "Academic genealogy · Diego Tavares Volpatto",
    sub: "Documented selection · arrows point from advisor or mentor to student",
    distance: "links",
    one: "link",
    root: "starting point",
    ancestor: "ancestry",
    collateral: "collateral branch",
    legend:
      "Solid: recorded supervision   ·   Dashed: study or mentorship   ·   Dotted: disputed attribution",
    caveat:
      "Distances are calculated within this graph only. Paths through Klein or Bruns depend on the disputed attribution for Föppl.",
    caveat2:
      "Euler–Lagrange denotes correspondence and intellectual influence. This is not a uniform chain of doctoral supervision.",
    source:
      "Sources and notes: see the JSON dataset and website page. Research: September 2026 · CC BY 4.0",
  },
};

/** Graphviz lays out the documented edges; no invented illustrative links. */
export function genealogyGraph(data, locale) {
  const l = labels[locale];
  return {
    name: "academic_genealogy",
    directed: true,
    graphAttributes: {
      rankdir: "TB",
      bgcolor: "#fcfcfe",
      pad: "0.65",
      nodesep: "0.28",
      ranksep: "0.48",
      splines: "polyline",
      fontname: "Arial",
      label: `${l.title}\n${l.sub}\n\n${l.legend}\n${l.caveat}\n${l.caveat2}\n${l.source}`,
      labelloc: "t",
      fontsize: "14",
      fontcolor: "#25324a",
    },
    nodeAttributes: {
      shape: "box",
      style: "rounded,filled",
      fontname: "Arial",
      fontsize: "13",
      margin: "0.2,0.12",
      color: "#cbd3e0",
      fillcolor: "#ffffff",
      fontcolor: "#24324a",
      penwidth: "1.1",
    },
    edgeAttributes: { color: "#8a95a9", arrowsize: "0.6", penwidth: "1.15" },
    nodes: data.people.map((person) => ({
      name: person.id,
      attributes: {
        label: `${person.name}\n${person.distance} ${person.distance === 1 ? l.one : l.distance} · ${person.id === data.root ? l.root : person.ancestor ? l.ancestor : l.collateral}`,
        ...(person.id === data.root
          ? {
              fillcolor: "#24324a",
              color: "#24324a",
              fontcolor: "#ffffff",
              penwidth: "1.8",
            }
          : {}),
        ...(["timoshenko", "prandtl", "gauss", "euler"].includes(person.id)
          ? { fillcolor: "#efedfa", color: "#8a80ba", penwidth: "1.7" }
          : {}),
        ...(person.id === "foppl"
          ? { fillcolor: "#faf3e9", color: "#a58b65" }
          : {}),
      },
    })),
    edges: data.edges.map((edge) => ({
      tail: edge.from,
      head: edge.to,
      attributes: {
        style: { doctoral: "solid", historical: "dashed", disputed: "dotted" }[
          edge.kind
        ],
        ...(edge.kind === "disputed"
          ? { color: "#937648", penwidth: "1.8" }
          : {}),
      },
    })),
  };
}

export async function generateGenealogy(outputDirectory) {
  const { instance } = await import("@viz-js/viz");
  const data = await loadGenealogy(),
    viz = await instance();
  await mkdir(outputDirectory, { recursive: true });
  for (const locale of ["pt", "en"]) {
    let svg = viz.renderString(genealogyGraph(data, locale), {
      format: "svg",
      engine: "dot",
    });
    // Standalone, self-contained SVG: no DTD, scripts, fonts or remote resources.
    svg = svg
      .replace(/<!DOCTYPE[\s\S]*?>\s*/g, "")
      .replace(/<!--[^]*?-->/g, "");
    svg = svg.replace(
      /<svg\b/,
      `<svg role="img" aria-labelledby="genealogy-title genealogy-description" xml:lang="${locale}"`,
    );
    svg = svg.replace(
      /(<svg\b[^>]*>)/,
      `$1\n<title id="genealogy-title">${xml(labels[locale].title)}</title><desc id="genealogy-description">${xml(`${labels[locale].sub}. ${labels[locale].legend}. ${labels[locale].caveat} ${labels[locale].caveat2}`)}</desc>`,
    );
    await writeFile(
      join(outputDirectory, `academic-genealogy-${locale}.svg`),
      svg,
    );
    await writeFile(
      join(outputDirectory, `academic-genealogy-${locale}.json`),
      JSON.stringify(
        {
          ...data,
          locale,
          license: "CC BY 4.0",
          interpretation: labels[locale].caveat + " " + labels[locale].caveat2,
          people: data.people.map((person) => ({
            ...person,
            contribution: local(person.contribution, locale),
          })),
          sources: data.sources.map((item) => ({
            ...item,
            note: local(item.note, locale),
          })),
        },
        null,
        2,
      ) + "\n",
    );
  }
}

export default function academicGenealogyAssets() {
  let publicDirectory;
  return {
    name: "academic-genealogy-assets",
    hooks: {
      "astro:config:setup": async ({ config }) => {
        publicDirectory = join(
          fileURLToPath(config.publicDir),
          "files/genealogy",
        );
        await generateGenealogy(publicDirectory);
      },
      "astro:server:setup": ({ server }) => {
        const file = source;
        server.watcher.add(file);
        server.watcher.on("change", async (changed) => {
          if (changed !== file) return;
          try {
            await generateGenealogy(publicDirectory);
            server.ws.send({ type: "full-reload" });
          } catch (error) {
            server.config.logger.error(error.message);
          }
        });
      },
    },
  };
}
