import { z } from "zod";

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
    brand: z.object({
      name: z.string().min(1),
      /** A felület kiemelőszíne (bármilyen CSS-szín, pl. oklch). */
      accentColor: z.string().default("oklch(0.55 0.2 260)"),
    }),
    locale: z.enum(["hu", "en"]).default("hu"),
    currency: z.string().length(3).default("HUF"),
    /** A localStorage-kulcs – ügyfelenként legyen egyedi. */
    storageKey: z.string().min(1).default("crm-data"),
    /** Induláskor mintaadatokkal töltse-e fel az üres adatbázist. */
    seedDemoData: z.boolean().default(true),
    modules: z
      .object({
        companies: z.boolean().default(true),
        deals: z.boolean().default(true),
        tasks: z.boolean().default(true),
      })
      .default({ companies: true, deals: true, tasks: true }),
    /** Egyedi elnevezések: pl. a „Üzletek” helyett „Ingatlanok”. */
    labels: z
      .object({
        contacts: z.string().optional(),
        companies: z.string().optional(),
        deals: z.string().optional(),
        tasks: z.string().optional(),
      })
      .default({}),
    pipeline: z.array(stageSchema).min(2),
    contactTags: z.array(z.string().min(1)).default([]),
    customFields: z
      .object({
        contact: z.array(customFieldSchema).default([]),
        company: z.array(customFieldSchema).default([]),
        deal: z.array(customFieldSchema).default([]),
        task: z.array(customFieldSchema).default([]),
      })
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
    for (const entity of ENTITY_TYPES) {
      const keys = cfg.customFields[entity].map((f) => f.key);
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
export type CrmConfig = z.output<typeof crmConfigSchema>;
export type CustomFieldDef = z.output<typeof customFieldSchema>;
export type Stage = z.output<typeof stageSchema>;

/** Típusellenőrzött config-definíció; hibás config esetén induláskor hibát dob. */
export function defineCrmConfig(input: CrmConfigInput): CrmConfig {
  const parsed = crmConfigSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Hibás crm.config:\n${issues.join("\n")}`);
  }
  return parsed.data;
}
