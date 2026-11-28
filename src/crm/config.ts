import { z } from "zod";
import { CARD_IDS, KPI_IDS } from "./dashboard";
import { INDUSTRY_IDS, mergeWithIndustry } from "./industries";

/*
 * Az ügyfelenkénti testreszabás sémája. Egy új ügyfélhez csak a
 * gyökérben lévő `crm.config.ts`-t kell átírni (vagy egy presetet
 * választani a `presets/` mappából) – a kód többi része ebből olvas.
 */

export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "money",
  "date",
  "email",
  "phone",
  "url",
  "select",
  "boolean",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

const fieldKey = z
  .string()
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Csak betű, szám és aláhúzás, betűvel kezdve");

export const customFieldSchema = z
  .object({
    key: fieldKey,
    label: z.string().min(1),
    type: z.enum(FIELD_TYPES),
    required: z.boolean().default(false),
    options: z.array(z.string().min(1)).optional(),
    /** Megjelenjen-e oszlopként a listanézetben. */
    showInList: z.boolean().default(false),
  })
  .refine((f) => f.type !== "select" || (f.options && f.options.length > 0), {
    message: "A select típusú mezőhöz kötelező az options lista",
  });

export const stageSchema = z.object({
  id: fieldKey,
  label: z.string().min(1),
  /** Esély százalékban – a súlyozott pipeline-értékhez. */
  probability: z.number().min(0).max(100),
  kind: z.enum(["open", "won", "lost"]).default("open"),
});

export const ENTITY_TYPES = ["contact", "company", "deal", "task"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const crmConfigSchema = z
  .object({
    /**
     * Üzlettípus: a profil adja a modulok, bővítmények, menünevek, pipeline,
     * címkék, egyedi mezők és mintaadatok alapértelmezését (src/crm/industries.ts).
     */
    industry: z.enum(INDUSTRY_IDS).default("general"),
    brand: z.object({
      name: z.string().min(1),
      /** A felület kiemelőszíne (bármilyen CSS-szín, pl. oklch). */
      accentColor: z.string().default("oklch(0.55 0.2 260)"),
      /**
       * Az oldalsávban az assets/logo.svg jelenjen-e meg; false esetén a
       * márkanév kezdőbetűje a kiemelőszínnel.
       */
      showLogo: z.boolean().default(true),
    }),
    locale: z.enum(["hu", "en"]).default("hu"),
    currency: z.string().length(3).default("HUF"),
    /** A localStorage-kulcs – ügyfelenként legyen egyedi. */
    storageKey: z.string().min(1).default("crm-data"),
    /** Képfeltöltés: a Cloudinary-n ebbe a (gyökér)mappába kerülnek a képek. */
    media: z
      .object({
        folder: z
          .string()
          .regex(/^[0-9A-Za-z_-]+(\/[0-9A-Za-z_-]+)*$/)
          .default("crm"),
      })
      .default({ folder: "crm" }),
    /** Induláskor mintaadatokkal töltse-e fel az üres adatbázist. */
    seedDemoData: z.boolean().default(true),
    modules: z
      .object({
        companies: z.boolean().default(true),
        deals: z.boolean().default(true),
        tasks: z.boolean().default(true),
      })
      .default({ companies: true, deals: true, tasks: true }),
    /**
     * Bekapcsolt bővítmények id-jai (pl. ["real-estate"]). Az elérhető
     * bővítmények listája: src/crm/addon-registry.ts
     */
    addons: z.array(z.string().min(1)).default([]),
    /**
     * Menüpontok átnevezése: kulcs a menüpont azonosítója (contacts,
     * companies, deals, tasks, vagy egy bővítményé, pl. properties).
     */
    labels: z.record(z.string(), z.string().min(1)).default({}),
    /**
     * Bővítményenkénti beállítások, pl. { menu: { sections: ["Előételek", …] } }.
     * Hogy egy bővítmény mit fogad el, a saját README-je írja le.
     */
    addonSettings: z.record(z.string(), z.record(z.string(), z.unknown())).default({}),
    /**
     * Az Áttekintés: mely számok és kártyák, milyen sorrendben (src/crm/dashboard.ts).
     * Az üzlettípus-profil adja; bármelyik kulcs felülírható.
     */
    dashboard: z
      .object({
        kpis: z.array(z.enum(KPI_IDS)).optional(),
        cards: z.array(z.enum(CARD_IDS)).optional(),
        /** A bővítmények widgetjei (pl. ingatlanok) a mag számai elé kerüljenek. */
        addonsFirst: z.boolean().default(false),
        /** Időpontos üzleteknél (pl. rendezvények) az egyedi dátummező kulcsa. */
        dealDateField: z.string().optional(),
        /** Ezeknél összegzendő szám-mező (pl. vendégek száma). */
        dealSumField: z.string().optional(),
        /** „Közelgő” = a következő ennyi nap. */
        horizonDays: z.number().int().positive().default(30),
      })
      .default({ addonsFirst: false, horizonDays: 30 }),
    pipeline: z.array(stageSchema).min(2),
    contactTags: z.array(z.string().min(1)).default([]),
    customFields: z
      .object({
        contact: z.array(customFieldSchema).default([]),
        company: z.array(customFieldSchema).default([]),
        deal: z.array(customFieldSchema).default([]),
        task: z.array(customFieldSchema).default([]),
      })
      // Bővítmények saját entitásai is kaphatnak egyedi mezőt (pl. property).
      .catchall(z.array(customFieldSchema))
      .default({ contact: [], company: [], deal: [], task: [] }),
  })
  .superRefine((cfg, ctx) => {
    const ids = cfg.pipeline.map((s) => s.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", path: ["pipeline"], message: "Ismétlődő stage id" });
    }
    if (!cfg.pipeline.some((s) => s.kind === "open")) {
      ctx.addIssue({
        code: "custom",
        path: ["pipeline"],
        message: "Legalább egy nyitott stage kell",
      });
    }
    for (const [entity, fields] of Object.entries(cfg.customFields)) {
      const keys = fields.map((f) => f.key);
      if (new Set(keys).size !== keys.length) {
        ctx.addIssue({
          code: "custom",
          path: ["customFields", entity],
          message: "Ismétlődő egyedi mező kulcs",
        });
      }
    }
  });

export type CrmConfigInput = z.input<typeof crmConfigSchema>;
/** Az ügyfél configja: a pipeline (és minden más) a profilból is jöhet. */
export type ClientConfigInput = Omit<CrmConfigInput, "pipeline"> & {
  pipeline?: CrmConfigInput["pipeline"];
};
export type CrmConfig = z.output<typeof crmConfigSchema>;
export type CustomFieldDef = z.output<typeof customFieldSchema>;
export type Stage = z.output<typeof stageSchema>;

/** Egy entitás egyedi mezői (bővítmény-entitásnál is; ha nincs, üres lista). */
export function customFieldsOf(config: CrmConfig, entity: string): CustomFieldDef[] {
  return config.customFields[entity] ?? [];
}

/**
 * Típusellenőrzött config-definíció: az üzlettípus-profil alapértelmezései +
 * az ügyfél beállításai. Hibás config esetén induláskor érthető hibát dob.
 */
export function defineCrmConfig(input: ClientConfigInput): CrmConfig {
  const parsed = crmConfigSchema.safeParse(mergeWithIndustry(input));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Hibás crm.config:\n${issues.join("\n")}`);
  }
  return parsed.data;
}
