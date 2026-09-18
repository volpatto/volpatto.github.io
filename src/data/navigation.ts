import type { Language, Translation } from "./profile";

export const pages = [
  {
    id: "home",
    label: { pt: "Sobre", en: "About" },
    path: { pt: "", en: "en/" },
  },
  {
    id: "research",
    label: { pt: "Pesquisa", en: "Research" },
    path: { pt: "pesquisa/", en: "en/research/" },
  },
  {
    id: "publications",
    label: { pt: "Publicações", en: "Publications" },
    path: { pt: "publicacoes/", en: "en/publications/" },
  },
  {
    id: "software",
    label: { pt: "Software", en: "Software" },
    path: { pt: "software/", en: "en/software/" },
  },
  {
    id: "teaching",
    label: { pt: "Ensino", en: "Teaching" },
    path: { pt: "ensino/", en: "en/teaching/" },
  },
  {
    id: "people",
    label: { pt: "Orientações", en: "Supervision" },
    path: { pt: "orientacoes/", en: "en/supervision/" },
  },
  {
    id: "groups",
    label: { pt: "Grupos de pesquisa", en: "Research groups" },
    path: { pt: "grupos/", en: "en/groups/" },
  },
  {
    id: "collaborations",
    label: { pt: "Parcerias e projetos", en: "Collaborations" },
    path: { pt: "parcerias/", en: "en/collaborations/" },
  },
  {
    id: "cv",
    label: { pt: "Currículo", en: "CV" },
    path: { pt: "curriculo/", en: "en/cv/" },
  },
  {
    id: "contact",
    label: { pt: "Contato", en: "Contact" },
    path: { pt: "contato/", en: "en/contact/" },
  },
] as const;

// Informational pages are reached through the footer, outside the academic menu.
export const utilityPages = [
  {
    id: "licensing",
    label: { pt: "Licenciamento", en: "Licensing" },
    path: { pt: "licenciamento/", en: "en/licensing/" },
  },
] as const;
export const sitePages = [...pages, ...utilityPages];
export type PageId = (typeof sitePages)[number]["id"];
export function pageUrl(page: PageId, lang: Language) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "") + "/";
  return base + sitePages.find((item) => item.id === page)!.path[lang];
}
export function pageLabel(page: PageId, lang: Language) {
  return sitePages.find((item) => item.id === page)!.label[lang];
}
export const pageDescriptions: Record<PageId, Translation> = {
  home: {
    pt: "Diego Volpatto, pesquisador do LNCC e docente em Modelagem Computacional. Métodos numéricos, termodinâmica e aprendizado de máquina científico.",
    en: "Diego Volpatto, researcher at LNCC and faculty member in Computational Modeling. Numerical methods, thermodynamics and scientific machine learning.",
  },
  research: {
    pt: "Linhas de pesquisa de Diego Volpatto: métodos numéricos, meios porosos, termodinâmica, SciML, transporte reativo e quantificação de incertezas.",
    en: "Diego Volpatto’s research: numerical methods, porous media, thermodynamics, SciML, reactive transport and uncertainty quantification.",
  },
  publications: {
    pt: "Artigos de Diego Volpatto em periódicos científicos, com autoria e links para os DOIs.",
    en: "Journal articles by Diego Volpatto, with authors and DOI links.",
  },
  software: {
    pt: "Software científico: voids, torch-flash, thermoml-io e outros projetos de código aberto.",
    en: "Scientific software: voids, torch-flash, thermoml-io and other open-source projects.",
  },
  teaching: {
    pt: "Disciplinas de Diego Volpatto no PPG em Modelagem Computacional do LNCC e materiais de ensino.",
    en: "Courses taught by Diego Volpatto in LNCC’s Graduate Program in Computational Modeling, and teaching materials.",
  },
  people: {
    pt: "Orientações e coorientações de Diego Volpatto no LNCC e em instituições parceiras.",
    en: "Students supervised and co-supervised by Diego Volpatto at LNCC and partner institutions.",
  },
  groups: {
    pt: "Participação de Diego Volpatto nos grupos de pesquisa ThermoPhase e IPES.",
    en: "Diego Volpatto’s participation in the ThermoPhase and IPES research groups.",
  },
  collaborations: {
    pt: "Parcerias acadêmicas e participação de Diego Volpatto em projetos de pesquisa.",
    en: "Diego Volpatto’s academic collaborations and research projects.",
  },
  cv: {
    pt: "Experiência profissional de Diego Volpatto no LNCC e na ESSS, formação acadêmica, Lattes e CV em PDF.",
    en: "Diego Volpatto’s professional experience at LNCC and ESSS, education, Lattes profile and PDF CV.",
  },
  contact: {
    pt: "Contato de Diego Volpatto no Laboratório Nacional de Computação Científica, em Petrópolis.",
    en: "Contact Diego Volpatto at the National Laboratory for Scientific Computing in Petrópolis, Brazil.",
  },
  licensing: {
    pt: "Licenças dos textos e do código do site de Diego Volpatto, com créditos e condições dos materiais de outras fontes.",
    en: "Licenses for the text and code of Diego Volpatto’s website, with credits and terms for materials from other sources.",
  },
};
