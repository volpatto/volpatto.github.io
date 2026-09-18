export type Language = "pt" | "en";
export type Translation = { pt: string; en: string };
export const t = (value: Translation, lang: Language) => value[lang];
export const profile = {
  name: "Diego Tavares Volpatto",
  email: "volpatto@lncc.br",
  lattes: "http://lattes.cnpq.br/3999178670179183",
  orcid: "https://orcid.org/0000-0002-3107-3259",
  github: "https://github.com/volpatto",
  linkedin: "https://www.linkedin.com/in/diego-volpatto-1a286068",
  cvUpdated: "2026-08-23",
  contentReviewed: "2026-09-18",
};
export const research = [
  {
    symbol: "∇",
    figure: {
      file: "images/research/voids-darcy-brinkman.png",
      width: 2340,
      height: 1116,
      alt: {
        pt: "Oito campos de magnitude da velocidade em um domínio quadrado, com cavidades circulares de frações de área entre zero e 0,70.",
        en: "Eight velocity-magnitude fields in a square domain, with circular cavities covering area fractions from zero to 0.70.",
      },
      caption: {
        pt: "Escoamento Darcy–Brinkman em um meio poroso com cavidade circular: magnitude da velocidade para diferentes frações de área da cavidade. Caso sintético do voids, resolvido por elementos finitos P2/P1.",
        en: "Darcy–Brinkman flow in a porous medium with a circular cavity: velocity magnitude for different cavity area fractions. A synthetic voids example solved with P2/P1 finite elements.",
      },
      source: "https://geomech-project.github.io/voids/verification/vug_2d/",
      credit: { pt: "Fonte: documentação do voids", en: "Source: voids documentation" },
    },
    title: {
      pt: "Métodos numéricos & meios porosos",
      en: "Numerical methods & porous media",
    },
    description: {
      pt: "Formulações de elementos finitos descontínuos, híbridos e estabilizados para escoamentos em meios heterogêneos.",
      en: "Discontinuous, hybrid and stabilized finite element formulations for flow in heterogeneous media.",
    },
    tags: ["FEM", "Galerkin", "Multiscale"],
    detail: {
      pt: "Investigo problemas multiescala, acoplamento hidromecânico e modelos de dupla porosidade e permeabilidade, com aplicações em rochas e reservatórios.",
      en: "I investigate multiscale problems, hydromechanical coupling and double-porosity and double-permeability models, with applications in rocks and reservoirs.",
    },
    link: {
      url: "https://github.com/geomech-project/voids",
      label: {
        pt: "Software relacionado: voids",
        en: "Related software: voids",
      },
    },
  },
  {
    symbol: "G",
    figure: {
      file: "images/research/gibbsflashnn-calibration.png",
      width: 1800,
      height: 1650,
      alt: {
        pt: "Diagramas pressão-composição de metanol e benzeno, comparando dois modelos de redes neurais antes e depois do ajuste a dados experimentais.",
        en: "Pressure–composition diagrams for methanol and benzene, comparing two neural-network models before and after fitting experimental data.",
      },
      caption: {
        pt: "Equilíbrio líquido–vapor de metanol + benzeno a 318,15 K no estudo GibbsFlashNN. Os painéis comparam Balance-Preserving FlashNN e GibbsFlashNN antes e depois da calibração experimental. Curvas contínuas e tracejadas representam as fases líquida e vapor; pontos indicam dados experimentais.",
        en: "Methanol + benzene vapor–liquid equilibrium at 318.15 K from the GibbsFlashNN study. Panels compare Balance-Preserving FlashNN and GibbsFlashNN before and after experimental calibration. Solid and dashed curves represent the liquid and vapor phases; points show experimental data.",
      },
      source: "https://github.com/ThermoPhase-FCSRG/gibbsflashnn-supporting-material",
      credit: { pt: "Fonte: estudo GibbsFlashNN", en: "Source: GibbsFlashNN study" },
    },
    title: {
      pt: "Termodinâmica computacional",
      en: "Computational thermodynamics",
    },
    description: {
      pt: "Equilíbrio de fases e propriedades termofísicas, com equações de estado, modelos de coeficiente de atividade e ajuste a dados experimentais.",
      en: "Phase equilibria and thermophysical properties, using equations of state, activity-coefficient models and fitting to experimental data.",
    },
    tags: ["Phase equilibria", "PyTorch", "SciML"],
    detail: {
      pt: "As aplicações incluem propriedades PVT de fluidos de petróleo, misturas com CO₂ e pontos de fulgor de biocombustíveis.",
      en: "Applications include PVT properties of petroleum fluids, CO₂ mixtures and biofuel flash points.",
    },
    link: {
      url: "https://github.com/ThermoPhase-FCSRG/torch-flash",
      label: {
        pt: "Software relacionado: torch-flash",
        en: "Related software: torch-flash",
      },
    },
  },
  {
    id: "sciml",
    symbol: "ℒ",
    figure: {
      file: "images/research/sciml-hybrid-flash-point.png",
      width: 1505,
      height: 1001,
      alt: {
        pt: "Diagrama de uma rede neural para ponto de fulgor: a previsão e os modelos de pressão de vapor e coeficientes de atividade alimentam o resíduo da equação de Liaw, incorporado à função de perda no treinamento.",
        en: "Diagram of a flash-point neural network: its prediction and vapor-pressure and activity-coefficient models feed the Liaw-equation residual, which enters the training loss.",
      },
      caption: {
        pt: "Rede neural para ponto de fulgor com resíduo da equação de Liaw no treinamento. Pressão de vapor e coeficientes de atividade são fornecidos por modelos termodinâmicos. Figura reproduzida integralmente, sem alterações.",
        en: "Flash-point neural network trained with the Liaw-equation residual. Vapor pressure and activity coefficients are supplied by thermodynamic models. Figure reproduced in full, without changes.",
      },
      source: "https://doi.org/10.1016/j.fluid.2026.114673",
      credit: { pt: "Souza, Volpatto, Barbosa Neto e Costa (2026), Fig. 3", en: "Souza, Volpatto, Barbosa Neto and Costa (2026), Fig. 3" },
      license: { label: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
    },
    title: {
      pt: "Aprendizagem de máquina científica (SciML)",
      en: "Scientific machine learning (SciML)",
    },
    description: {
      pt: "Estudo como incorporar informação física ao aprendizado de máquina e integrar modelos aprendidos a simulações científicas.",
      en: "I study how to incorporate physical information into machine learning and integrate learned models into scientific simulations.",
    },
    tags: ["SciML", "On-demand learning", "Physics-informed ML"],
    topics: [
      {
        title: { pt: "Aprendizado sob demanda", en: "On-demand learning" },
        description: {
          pt: "Reúso de estados de equilíbrio e sensibilidades para acelerar cálculos durante a simulação. Novas avaliações completas são feitas quando a aproximação não atende ao critério de aceitação.",
          en: "Reusing equilibrium states and sensitivities to accelerate calculations during simulation. New full evaluations are performed when an approximation fails the acceptance criterion.",
        },
        reference: {
          url: "https://doi.org/10.1007/s10596-021-10126-2",
          label: { pt: "Estudo de transporte reativo com ODML", en: "Reactive transport study with ODML" },
        },
      },
      {
        title: { pt: "Termodinâmica híbrida", en: "Hybrid thermodynamics" },
        description: {
          pt: "Modelos neurais com balanço material por construção e treinamento orientado por relações termodinâmicas, como Gibbs–Duhem. As aplicações incluem cálculos de flash e pontos de fulgor.",
          en: "Neural models with material balance preserved by construction and training guided by thermodynamic relations such as Gibbs–Duhem. Applications include flash calculations and flash points.",
        },
        reference: {
          url: "https://github.com/ThermoPhase-FCSRG/gibbsflashnn-supporting-material",
          label: { pt: "Estudo GibbsFlashNN", en: "GibbsFlashNN study" },
        },
      },
      {
        title: { pt: "Métodos numéricos e informação física", en: "Numerical methods and physical information" },
        description: {
          pt: "Acoplamento de modelos aprendidos a solvers, incluindo relações constitutivas neurais e diferenciação automática. Avalio precisão, resíduos físicos e custo computacional em relação a soluções de referência.",
          en: "Coupling learned models with solvers, including neural constitutive relations and automatic differentiation. I assess accuracy, physical residuals and computational cost against reference solutions.",
        },
        reference: {
          url: "https://thermophase-fcsrg.github.io/torch-flash/",
          label: { pt: "Ferramentas de termodinâmica diferenciável", en: "Differentiable thermodynamics tools" },
        },
      },
    ],
    link: {
      url: "https://doi.org/10.1016/j.fluid.2026.114673",
      label: { pt: "Artigo: redes neurais e ponto de fulgor", en: "Paper: neural networks and flash points" },
    },
  },
  {
    symbol: "∂",
    figure: {
      file: "images/research/reactive-transport.png",
      width: 1801,
      height: 491,
      alt: {
        pt: "Distribuição de calcita em azul e dolomita em laranja, comparando o algoritmo convencional e o aprendizado sob demanda em um meio poroso heterogêneo.",
        en: "Calcite in blue and dolomite in orange, comparing the conventional algorithm and on-demand learning in a heterogeneous porous medium.",
      },
      caption: {
        pt: "Calcita e dolomita durante uma simulação de transporte reativo: cálculo convencional à esquerda e aprendizado sob demanda (ODML) à direita. Os dois campos correspondem ao passo 1500, cerca de 1,43 dias de simulação.",
        en: "Calcite and dolomite during a reactive transport simulation: conventional calculations on the left and on-demand learning (ODML) on the right. Both fields correspond to time step 1500, about 1.43 simulated days.",
      },
      source: "https://doi.org/10.1007/s10596-021-10126-2",
      credit: { pt: "Kyas et al. (2022), Fig. 3(c–d)", en: "Kyas et al. (2022), Fig. 3(c–d)" },
      license: { label: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
    },
    title: {
      pt: "Transporte reativo & geoquímica",
      en: "Reactive transport & geochemistry",
    },
    description: {
      pt: "Acoplamento de escoamento, transporte de espécies e reações geoquímicas em meios porosos heterogêneos.",
      en: "Coupling flow, species transport and geochemical reactions in heterogeneous porous media.",
    },
    tags: ["Reactive transport", "Reaktoro"],
    detail: {
      pt: "Os estudos integram Reaktoro e Firedrake para acompanhar a composição dos fluidos e a dissolução e precipitação de minerais.",
      en: "Studies integrate Reaktoro and Firedrake to track fluid composition and mineral dissolution and precipitation.",
    },
    link: {
      url: "https://doi.org/10.1007/s10596-021-10126-2",
      label: {
        pt: "Artigo: Reaktoro e Firedrake",
        en: "Paper: Reaktoro and Firedrake",
      },
    },
  },
  {
    symbol: "𝑃",
    figure: {
      file: "images/research/bayesian-seird.png",
      width: 1801,
      height: 1672,
      alt: {
        pt: "Séries temporais dos compartimentos de um modelo SEIRD, com observações de casos e óbitos e faixas de credibilidade ao redor das previsões.",
        en: "Time series for SEIRD model compartments, with observed cases and deaths and credibility bands around predictions.",
      },
      caption: {
        pt: "Modelo epidemiológico aplicado ao Brasil, com dados de 2020. As curvas usam estimativas de máximo a posteriori (MAP), acompanhadas por intervalos de credibilidade de 95%.",
        en: "Epidemiological model applied to Brazil using 2020 data. Curves use maximum a posteriori (MAP) estimates, with 95% credible intervals.",
      },
      source: "https://doi.org/10.1080/17477778.2021.1977731",
      credit: { pt: "Volpatto et al. (2021, publicação online), Fig. 3(a)", en: "Volpatto et al. (2021, online publication), Fig. 3(a)" },
    },
    title: { pt: "Inferência & incertezas", en: "Inference & uncertainty" },
    description: {
      pt: "Calibração Bayesiana, análise de sensibilidade e propagação de incertezas em modelos computacionais.",
      en: "Bayesian calibration, sensitivity analysis and uncertainty propagation in computational models.",
    },
    tags: ["Bayesian inference", "UQ"],
    detail: {
      pt: "Estudo a identificação de parâmetros a partir de observações e seus efeitos sobre as previsões, com aplicações em sistemas dinâmicos e modelos epidemiológicos.",
      en: "I study parameter identification from observations and its effects on predictions, with applications in dynamical systems and epidemiological models.",
    },
    link: {
      url: "https://doi.org/10.1080/17477778.2021.1977731",
      label: {
        pt: "Artigo: inferência Bayesiana",
        en: "Paper: Bayesian inference",
      },
    },
  },
];
