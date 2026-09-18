import type { Translation } from "./profile";

export const software = [
  {
    name: "voids",
    logo: { file: "voids-logo.png", width: 597, height: 359 },
    category: { pt: "Rocha digital", en: "Digital porous media" },
    description: {
      pt: "Modelagem de meios porosos digitais em Python: redes de poros, propriedades petrofísicas e simulação de transporte monofásico.",
      en: "Digital porous media modeling in Python: pore networks, petrophysical properties and single-phase transport simulation.",
    },
    tags: ["Python", "PNM", "FEM / FVM / LBM"],
    repo: "https://github.com/geomech-project/voids",
    docs: "https://geomech-project.github.io/voids/",
    detail: {
      pt: "Tem como foco modelos de redes de poros, com métodos complementares de volumes finitos, elementos finitos e Boltzmann em rede. A documentação reúne exemplos e distingue verificação numérica de validação experimental.",
      en: "Its main focus is pore network modeling, with complementary finite-volume, finite-element and lattice Boltzmann methods. The documentation includes examples and distinguishes numerical verification from experimental validation.",
    },
  },
  {
    name: "torch-flash",
    logo: { file: "torch-flash-logo.svg", width: 680, height: 240 },
    category: {
      pt: "Termodinâmica diferenciável",
      en: "Differentiable thermodynamics",
    },
    description: {
      pt: "Propriedades termodinâmicas e equilíbrio de fases com PyTorch, integrando diferenciação automática, otimização e aprendizado de máquina.",
      en: "Thermodynamic properties and phase equilibria with PyTorch, connecting automatic differentiation, optimization and machine learning.",
    },
    tags: ["Python", "PyTorch", "Autodiff"],
    repo: "https://github.com/ThermoPhase-FCSRG/torch-flash",
    docs: "https://thermophase-fcsrg.github.io/torch-flash/",
    detail: {
      pt: "Inclui equações de estado, modelos de coeficiente de atividade e cálculos de estabilidade e flash. Exemplos documentados mostram a avaliação de propriedades, suas derivadas e o uso de parâmetros ajustáveis.",
      en: "Includes equations of state, activity coefficient models, and stability and flash calculations. Documented examples cover property evaluation, derivatives and trainable parameters.",
    },
  },
  {
    name: "thermoml-io",
    category: { pt: "Dados termofísicos", en: "Thermophysical data" },
    description: {
      pt: "Acesso, busca e leitura de dados experimentais ThermoML em Python, preservando condições, incertezas e referências de cada medida.",
      en: "Access, search and parse experimental ThermoML data in Python, preserving conditions, uncertainties and references for each measurement.",
    },
    tags: ["Python", "ThermoML", "Data provenance"],
    repo: "https://github.com/ThermoPhase-FCSRG/thermoml-io",
    docs: "https://thermophase-fcsrg.github.io/thermoml-io/",
    detail: {
      pt: "Permite organizar dados de publicações para análise e ajuste de modelos, com exportação tabular e rastreabilidade da fonte. Exemplos e notebooks documentam a busca, a leitura e o tratamento dos resultados.",
      en: "Helps organize published data for analysis and model fitting, with tabular export and source traceability. Examples and notebooks document searching, parsing and handling the results.",
    },
  },
];

export const publications = [
  {
    year: "2026",
    title:
      "Modeling flash points of biofuels using thermodynamically consistent neural networks",
    authors:
      "M. P. de Omena Souza, D. T. Volpatto, A. M. Barbosa Neto, M. C. da Costa",
    journal: "Fluid Phase Equilibria",
    citation: "605, 114673",
    doi: "10.1016/j.fluid.2026.114673",
    topic: { pt: "Termodinâmica & SciML", en: "Thermodynamics & SciML" },
  },
  {
    year: "2025",
    title:
      "Using Reaktoro for mineral and gas solubility calculations with the Extended UNIQUAC model",
    authors:
      "A. M. M. Leal, T. Tambach, D. Volpatto, X. Liang, P. L. Fosbøl, K. Thomsen",
    journal: "Applied Geochemistry",
    citation: "180, 106274",
    doi: "10.1016/j.apgeochem.2024.106274",
    topic: { pt: "Geoquímica", en: "Geochemistry" },
  },
  {
    year: "2025",
    title: "Modeling flash points of biofuels using neural networks",
    authors:
      "M. P. de Omena Souza, D. C. do Nascimento, D. T. Volpatto, G. G. Ribeiro, A. M. Barbosa Neto, M. C. da Costa",
    journal: "Fluid Phase Equilibria",
    citation: "596, 114439",
    doi: "10.1016/j.fluid.2025.114439",
    topic: { pt: "Termodinâmica & SciML", en: "Thermodynamics & SciML" },
  },
  {
    year: "2023",
    title:
      "A new modelling framework for predator-prey interactions: A case study of an aphid-ladybeetle system",
    authors:
      "L. dos Anjos, G. T. Naozuka, D. T. Volpatto, W. A. C. Godoy, M. I. da Silveira Costa, R. C. Almeida",
    journal: "Ecological Informatics",
    citation: "77, 102168",
    doi: "10.1016/j.ecoinf.2023.102168",
    topic: { pt: "Modelagem & inferência", en: "Modeling & inference" },
  },
  {
    year: "2022",
    title:
      "Accelerated reactive transport simulations in heterogeneous porous media using Reaktoro and Firedrake",
    authors: "S. Kyas, D. Volpatto, M. O. Saar, A. M. M. Leal",
    journal: "Computational Geosciences",
    citation: "26, 295–327",
    doi: "10.1007/s10596-021-10126-2",
    topic: { pt: "Transporte reativo", en: "Reactive transport" },
  },
  {
    year: "2022",
    title:
      "Avaliação de Estratégias de Relaxamento do Distanciamento Social para o Brasil e o Estado do Rio de Janeiro",
    authors:
      "D. T. Volpatto, A. C. M. Resende, L. dos Anjos, J. V. O. Silva, C. M. Dias, R. C. Almeida, S. M. C. Malta",
    journal: "Trends in Computational and Applied Mathematics",
    citation: "23, 223–242",
    doi: "10.5540/tcam.2022.023.02.00223",
    topic: { pt: "Modelagem & inferência", en: "Modeling & inference" },
  },
  {
    year: "2021",
    title:
      "A generalised SEIRD model with implicit social distancing mechanism: A Bayesian approach for the identification of the spread of COVID-19 with applications in Brazil and Rio de Janeiro state",
    authors:
      "D. T. Volpatto, A. C. M. Resende, L. dos Anjos, J. V. O. Silva, C. M. Dias, R. C. Almeida, S. M. C. Malta",
    journal: "Journal of Simulation",
    citation: "Online first, 2021",
    doi: "10.1080/17477778.2021.1977731",
    topic: { pt: "Modelagem & inferência", en: "Modeling & inference" },
  },
];

export const courses = [
  {
    code: "GA-033",
    description: {
      pt: "Implementação de elementos finitos: malhas, funções de base, quadratura, montagem de sistemas e condições de contorno. A ementa inclui verificação de implementações, taxas de convergência e aplicações com FEniCS, Firedrake e NGSolve.",
      en: "Finite element implementation: meshes, basis functions, quadrature, system assembly and boundary conditions. The syllabus includes implementation verification, convergence rates and applications with FEniCS, Firedrake and NGSolve.",
    },
    title: {
      pt: "Método de Elementos Finitos: Implementação Computacional",
      en: "Finite Element Method: Computational Implementation",
    },
  },
  {
    code: "GA-020",
    description: {
      pt: "Métodos para equações diferenciais ordinárias, diferenças finitas e elementos finitos. Abrange discretizações variacionais e a aproximação de problemas elípticos e parabólicos.",
      en: "Methods for ordinary differential equations, finite differences and finite elements. Covers variational discretizations and the approximation of elliptic and parabolic problems.",
    },
    title: {
      pt: "Solução Numérica de Equações Diferenciais",
      en: "Numerical Solution of Differential Equations",
    },
  },
];

type Student = {
  name: string;
  institution: string;
  year: string;
  role: Translation;
  topic?: Translation;
  provisional?: boolean;
  level?: Translation;
};
export const students: Student[] = [
  {
    name: "Karen Dayana Arias Sandoval",
    institution: "LNCC",
    year: "2025",
    role: { pt: "Orientação", en: "Supervisor" },
  },
  {
    name: "Breno Vieira Sousa",
    institution: "LNCC",
    year: "2025",
    role: { pt: "Orientação", en: "Supervisor" },
    topic: {
      pt: "Formulações estabilizadas de elementos finitos para transporte de CO₂ em carbodutos.",
      en: "Stabilized finite element formulations for CO₂ transport in pipelines.",
    },
    provisional: true,
  },
  {
    name: "Laira Lopes Silva",
    institution: "LNCC",
    year: "2025",
    role: { pt: "Coorientação", en: "Co-supervisor" },
  },
  {
    name: "Rennan Marques de Souza Damasceno",
    institution: "UDESC",
    year: "2026",
    role: { pt: "Coorientação", en: "Co-supervisor" },
    topic: {
      pt: "Análise de dados para validação automatizada de BSW em poços offshore.",
      en: "A data analysis pipeline for automated BSW validation in offshore wells.",
    },
    provisional: true,
  },
  {
    name: "Hanna Heloise Heyde",
    institution: "UDESC",
    year: "2026",
    role: { pt: "Coorientação", en: "Co-supervisor" },
    topic: {
      pt: "Modelagem baseada em SINDy de queda de pressão em poços produtores offshore.",
      en: "SINDy-based modeling of pressure drop in offshore production wells.",
    },
    provisional: true,
  },
  {
    name: "Marcel de Araujo",
    institution: "UDESC",
    year: "2026",
    role: { pt: "Coorientação", en: "Co-supervisor" },
    topic: {
      pt: "Modelagem híbrida de escoamento monofásico em poços injetores de petróleo.",
      en: "Hybrid modeling of single-phase flow in oilfield injection wells.",
    },
    provisional: true,
  },
];
export const alumni: Student[] = [
  {
    name: "Maurício Prado de Omena Souza",
    institution: "UNICAMP",
    year: "2025",
    role: { pt: "Coorientação", en: "Co-supervisor" },
    level: { pt: "Mestrado", en: "MSc" },
    topic: {
      pt: "Flash Point Modeling with Neural Networks: From a Data-Driven Approach to PINNs.",
      en: "Flash Point Modeling with Neural Networks: From a Data-Driven Approach to PINNs.",
    },
  },
  {
    name: "Natália Kauana Gesser Miotto",
    institution: "UDESC",
    year: "2024",
    role: { pt: "Coorientação", en: "Co-supervisor" },
    level: { pt: "Mestrado", en: "MSc" },
    topic: {
      pt: "Analysis of the impact of impurities in CO2-rich mixtures in CCS/CCUS applications.",
      en: "Analysis of the impact of impurities in CO2-rich mixtures in CCS/CCUS applications.",
    },
  },
  {
    name: "Maria Fernanda Marmilli de Alvarenga Campos Franzin",
    institution: "UDESC",
    year: "2024",
    role: { pt: "Orientação", en: "Supervisor" },
    level: { pt: "Iniciação científica", en: "Undergraduate research" },
  },
  {
    name: "Leonardo Augusto Lemos",
    institution: "UDESC",
    year: "2024",
    role: { pt: "Orientação", en: "Supervisor" },
    level: { pt: "Iniciação científica", en: "Undergraduate research" },
  },
  {
    name: "Giovanna Girotto",
    institution: "UDESC",
    year: "2024",
    role: { pt: "Orientação", en: "Supervisor" },
    level: { pt: "Iniciação científica", en: "Undergraduate research" },
  },
  {
    name: "Bernardo Skovronski Woitas",
    institution: "UDESC",
    year: "2024",
    role: { pt: "Orientação", en: "Supervisor" },
    level: { pt: "Iniciação científica", en: "Undergraduate research" },
  },
];

export const projects = [
  {
    year: "2026",
    label: { pt: "Rochas carbonáticas", en: "Carbonate rocks" },
    title: {
      pt: "Transferência de escala em rochas carbonáticas",
      en: "Upscaling in carbonate rocks",
    },
    text: {
      pt: "Métodos de transferência de escala e acoplamento hidromecânico para rochas carbonáticas com fraturas e feições vugulares. Participação em projeto coordenado por Márcio Arab Murad, com financiamento da Equinor Brasil.",
      en: "Upscaling methods and hydromechanical coupling for carbonate rocks with fractures and vugs. Participant in a project led by Márcio Arab Murad and funded by Equinor Brasil.",
    },
  },
  {
    year: "2024",
    label: { pt: "Produção offshore", en: "Offshore production" },
    title: {
      pt: "Monitoramento de poços offshore",
      en: "Offshore well monitoring",
    },
    text: {
      pt: "Sistemas híbridos de dados e modelos para monitoramento de poços offshore de óleo e gás. Participação em projeto coordenado por Marcelo Souza de Castro e certificado pela PRIO no Lattes.",
      en: "Hybrid data and model systems for monitoring offshore oil and gas wells. Participant in a project led by Marcelo Souza de Castro and certified by PRIO in the Lattes record.",
    },
  },
  {
    year: "2019",
    label: { pt: "Sistemas de produção", en: "Production systems" },
    title: {
      pt: "Modelagem integrada da produção",
      en: "Integrated production modeling",
    },
    text: {
      pt: "Integração da modelagem de reservatórios e de produção de petróleo. Participação em projeto coordenado por Antonio Marinho Barbosa Neto.",
      en: "Integration of reservoir and petroleum production modeling. Participant in a project led by Antonio Marinho Barbosa Neto.",
    },
  },
];
export const education = [
  {
    year: "2023",
    degree: {
      pt: "Doutorado em Modelagem Computacional",
      en: "DSc in Computational Modeling",
    },
    institution: "LNCC",
    thesis:
      "Hybrid and Discontinuous Finite Element Methods for porous media flow problems",
    advisor: "Abimael Fernando Dourado Loula",
    coAdvisor: "Antônio Tadeu Azevedo Gomes",
    detail: {
      pt: "Métodos de elementos finitos híbridos e descontínuos para escoamentos em meios porosos.",
      en: "Hybrid and discontinuous finite element methods for porous media flow.",
    },
  },
  {
    year: "2016",
    degree: {
      pt: "Mestrado em Modelagem Computacional",
      en: "MSc in Computational Modeling",
    },
    institution: "LNCC",
    thesis:
      "Modelagem Computacional do Acoplamento Hidro-geomecânico em Reservatórios Não-Convencionais de Gás",
    advisor: "Márcio Arab Murad",
    coAdvisor: "Eduardo Lúcio Mendes Garcia",
    detail: {
      pt: "Acoplamento hidro-geomecânico em reservatórios não convencionais de gás.",
      en: "Hydro-geomechanical coupling in unconventional gas reservoirs.",
    },
  },
  {
    year: "2013",
    degree: {
      pt: "Graduação em Engenharia Química",
      en: "BSc in Chemical Engineering",
    },
    institution: "UFRN",
    detail: {
      pt: "Universidade Federal do Rio Grande do Norte.",
      en: "Federal University of Rio Grande do Norte.",
    },
  },
];
