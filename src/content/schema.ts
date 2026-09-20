import { z } from "zod";
import { isLink } from "./links.ts";
import { renderInline } from "./markdown.ts";

// This is the contract between editable YAML and presentation components.
// Adding records uses the existing shapes; only new kinds of fields need code changes.
const text = z
  .string()
  .refine((value) => value.trim().length > 0, "Preencha o texto.");
const translation = z.strictObject({ pt: text, en: text });
const url = text.refine(
  isLink,
  "Use https://…, http://…, mailto:… ou /caminho/.",
);
const translatedUrl = z.strictObject({ pt: url, en: url });
const richText = text.superRefine((value, ctx) => {
  try {
    renderInline(value);
  } catch (error) {
    ctx.addIssue({ code: "custom", message: String(error) });
  }
});
const richTranslation = z.strictObject({ pt: richText, en: richText });
const year = z.union([text, z.number().int()]).transform(String);
const id = text.regex(
  /^[a-z][a-z0-9-]*$/,
  "Use letras minúsculas, números e hífens.",
);
const file = text.refine(
  (value) =>
    !value.startsWith("/") && !value.includes("..") && !value.includes(":"),
  "Informe o caminho relativo à pasta public/.",
);
const image = z.strictObject({
  file,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: translation,
});
const link = z.strictObject({ label: translation, url });
const pageIds = [
  "home",
  "research",
  "publications",
  "software",
  "teaching",
  "people",
  "groups",
  "collaborations",
  "cv",
  "contact",
  "licensing",
] as const;
const page = z.strictObject({
  id: z.enum(pageIds),
  label: translation,
  path: z
    .strictObject({ pt: z.string(), en: text })
    .refine(
      (paths) =>
        Object.values(paths).every(
          (path) => path === "" || /^(?:[a-z0-9-]+\/)+$/.test(path),
        ),
      "Use caminhos como pesquisa/ e en/research/, sem barra inicial.",
    ),
  description: translation,
});
const heading = { page, heading: translation };
const student = z.strictObject({
  name: text,
  institution: text,
  year,
  role: translation,
  topic: translation.optional(),
  provisional: z.boolean().optional(),
  level: translation.optional(),
});
const appointment = z.strictObject({
  institution: text,
  period: translation,
  role: translation,
});

function unique<T extends Record<string, unknown>>(
  schema: z.ZodType<T>,
  key: keyof T,
) {
  return z.array(schema).superRefine((items, ctx) => {
    const seen = new Set();
    items.forEach((item, index) => {
      if (seen.has(item[key]))
        ctx.addIssue({
          code: "custom",
          path: [index, String(key)],
          message: `Valor repetido: ${item[key]}`,
        });
      seen.add(item[key]);
    });
  });
}

export const schemas = {
  site: z.strictObject({
    profile: z.strictObject({
      name: text,
      email: z.email(),
      lattes: url,
      orcid: url,
      github: url,
      linkedin: url,
      cvUpdated: text,
      contentReviewed: text,
    }),
    identity: z.strictObject({
      shortName: text,
      affiliation: text,
      organization: text,
      organizationUrl: url,
      jobTitle: translation,
      homeTitle: translation,
    }),
    interface: z.strictObject({
      skipToContent: translation,
      homeLabel: translation,
      language: translation,
      darkMode: translation,
      lightMode: translation,
      navigation: translation,
      menu: text,
      backToTop: translation,
      backToTopLabel: translation,
    }),
    footer: z.strictObject({
      copyright: text,
      textLabel: translation,
      codeLabel: translation,
      disclaimer: translation,
      licensingLabel: translation,
    }),
    notFound: z.strictObject({
      title: text,
      heading: text,
      description: translation,
      homeLabel: text,
    }),
  }),
  home: z.strictObject({
    page,
    affiliation: translation,
    name: text,
    introduction: z.array(translation),
    portrait: image.extend({ caption: translation }),
    profileLinks: z.array(
      z
        .strictObject({
          profile: z.enum(["lattes", "orcid", "github", "linkedin"]).optional(),
          page: z.enum(pageIds).optional(),
          icon: z.enum(["lattes", "orcid", "github", "linkedin", "mail"]),
          label: translation,
        })
        .refine(
          (value) => Boolean(value.profile) !== Boolean(value.page),
          "Informe profile ou page, apenas um dos dois.",
        ),
    ),
    background: z.strictObject({
      heading: translation,
      paragraphs: z.array(richTranslation),
    }),
  }),
  research: z.strictObject({
    ...heading,
    enlargeLabel: translation,
    fullSizeLabel: translation,
    items: z.array(
      z.strictObject({
        id: id.optional(),
        title: translation,
        description: translation,
        detail: translation.optional(),
        topics: z
          .array(
            z.strictObject({
              title: translation,
              description: translation,
              reference: link,
            }),
          )
          .optional(),
        figure: image.extend({
          caption: translation,
          source: url,
          credit: translation,
          license: z.strictObject({ url, label: text }).optional(),
        }),
        link,
      }),
    ),
  }),
  publications: z.strictObject({
    ...heading,
    fullRecord: translation,
    items: unique(
      z.strictObject({
        year,
        title: text,
        authors: text,
        journal: text,
        citation: text,
        doi: text.regex(
          /^10\.\d{4,9}\/\S+$/,
          "Informe somente o DOI, começando por 10.…/",
        ),
        topic: translation,
      }),
      "doi",
    ),
  }),
  software: z.strictObject({
    ...heading,
    introduction: translation,
    practices: z.strictObject({
      heading: translation,
      paragraphs: z.array(richTranslation),
      items: z.array(
        z.strictObject({ title: translation, description: translation }),
      ),
    }),
    items: unique(
      z.strictObject({
        name: text,
        logo: image.omit({ alt: true }).optional(),
        category: translation,
        description: translation,
        detail: translation,
        repo: url,
        docs: url,
        packages: z.array(z.strictObject({ label: text, url })),
      }),
      "name",
    ),
    documentationLabel: translation,
    otherProjects: richTranslation,
    githubLabel: translation,
  }),
  teaching: z.strictObject({
    ...heading,
    introduction: translation,
    courses: unique(
      z.strictObject({
        code: text,
        title: translation,
        description: translation,
        metadata: translation,
      }),
      "code",
    ),
    sourceNote: translation,
    syllabi: link,
    material: z.strictObject({
      label: translation,
      heading: translation,
      description: translation,
      link,
    }),
  }),
  people: z.strictObject({
    ...heading,
    introduction: translation,
    currentHeading: translation,
    sourceNote: translation,
    sinceLabel: translation,
    provisionalLabel: translation,
    completedHeading: translation,
    students: z.array(student),
    alumni: z.array(student),
  }),
  groups: z.strictObject({
    ...heading,
    items: unique(
      z.strictObject({
        id,
        logo: image,
        affiliation: text,
        role: translation,
        name: text,
        paragraphs: z.array(translation),
        links: z.array(
          link.extend({ icon: z.enum(["github", "arrow-diagonal", "globe"]) }),
        ),
      }),
      "id",
    ),
  }),
  collaborations: z.strictObject({
    ...heading,
    introduction: translation,
    partners: unique(
      z.strictObject({
        id,
        logos: z.array(
          z.discriminatedUnion("kind", [
            z.strictObject({ kind: z.literal("lef") }),
            image.extend({
              kind: z.literal("image"),
              class: text.optional(),
              loading: z.enum(["lazy", "eager"]).optional(),
            }),
          ]),
        ),
        affiliation: text,
        name: translation,
        fullName: text.optional(),
        paragraphs: z.array(translation),
        links: z.array(
          z.strictObject({
            label: translation,
            url: translatedUrl,
            diagonal: z.boolean(),
          }),
        ),
      }),
      "id",
    ),
    projects: z.strictObject({
      heading: translation,
      introduction: translation,
      sinceLabel: translation,
      items: z.array(
        z.strictObject({ year, title: translation, text: translation }),
      ),
      sourceNote: translation,
    }),
    industryExperience: z.strictObject({
      heading: translation,
      description: richTranslation,
    }),
    industryPartners: z.strictObject({
      heading: translation,
      items: z.array(z.strictObject({ url, label: translation, logo: image })),
    }),
  }),
  cv: z.strictObject({
    ...heading,
    introduction: translation,
    lattesLabel: translation,
    download: z.strictObject({ file, label: translation }),
    sourceNote: translation,
    experience: z.strictObject({
      heading: translation,
      items: z.array(
        appointment.extend({
          description: translation,
          activities: z.array(translation),
        }),
      ),
      note: richTranslation,
    }),
    education: z.strictObject({
      heading: translation,
      items: z.array(
        z
          .strictObject({
            year,
            degree: translation,
            institution: text,
            detail: translation,
            thesis: text.optional(),
            advisor: text.optional(),
            coAdvisor: text.optional(),
          })
          .refine(
            (item) => !item.thesis || Boolean(item.advisor && item.coAdvisor),
            "Preencha advisor e coAdvisor quando houver thesis.",
          ),
      ),
      thesisLabel: translation,
      advisorLabel: translation,
      coAdvisorLabel: translation,
    }),
    appointments: z.strictObject({
      heading: translation,
      items: z.array(appointment),
      link: translation,
    }),
  }),
  contact: z.strictObject({
    ...heading,
    institution: translation,
    address: z.strictObject({
      pt: z.array(text).nonempty(),
      en: z.array(text).nonempty(),
    }),
    institutionalLink: link,
  }),
  licensing: z.strictObject({
    ...heading,
    introduction: translation,
    sections: unique(
      z.strictObject({
        id: id.optional(),
        headingId: id,
        heading: translation,
        paragraphs: z.array(
          z.strictObject({ text: richTranslation, class: text.optional() }),
        ),
        credits: z.array(
          z.strictObject({ title: translation, description: richTranslation }),
        ),
      }),
      "headingId",
    ),
  }),
};

export type Language = "pt" | "en";
export type Translation = z.infer<typeof translation>;
export type PageId = (typeof pageIds)[number];
export type Content = {
  [K in keyof typeof schemas]: z.output<(typeof schemas)[K]>;
};

export const contentFiles: Record<keyof Content, string> = {
  site: "conteudo/site.yaml",
  home: "conteudo/paginas/sobre.yaml",
  research: "conteudo/paginas/pesquisa.yaml",
  publications: "conteudo/paginas/publicacoes.yaml",
  software: "conteudo/paginas/software.yaml",
  teaching: "conteudo/paginas/ensino.yaml",
  people: "conteudo/paginas/orientacoes.yaml",
  groups: "conteudo/paginas/grupos.yaml",
  collaborations: "conteudo/paginas/parcerias.yaml",
  cv: "conteudo/paginas/curriculo.yaml",
  contact: "conteudo/paginas/contato.yaml",
  licensing: "conteudo/paginas/licenciamento.yaml",
};
