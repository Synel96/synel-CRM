/*
 * Mezőleírók: minden entitás űrlapja ezekből generálódik (alapmezők +
 * a crm.config egyedi mezői). Az új alapmező felvétele egy sor itt.
 */
import type { CrmConfig, CustomFieldDef, EntityType, FieldType } from "./config";
import { t, type MessageKey } from "./i18n";
import { contactName } from "./operations";
import type { CrmData, CustomValue, CustomValues } from "./types";

export type FormFieldType = FieldType | "relation" | "tags";

export type FormField = {
  /** Alapmezőnél a rekord property neve, egyedi mezőnél `custom.<key>`. */
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: { value: string; label: string }[];
  wide?: boolean;
  /** Üres szám/pénz mező null legyen (0 helyett). */
  nullable?: boolean;
  /** Segédszöveg a mező alatt. */
  hint?: string;
  /** Címke-mezőnél: csak a felkínált opciók választhatók (nincs szabad szöveg). */
  optionsOnly?: boolean;
};

export type FormValues = Record<string, string | boolean>;

const base = (
  name: string,
  labelKey: MessageKey,
  type: FormFieldType,
  extra: Partial<FormField> = {}
): FormField => ({ name, label: t(labelKey), type, required: false, ...extra });

export function customToFormField(f: CustomFieldDef): FormField {
  return {
    name: `custom.${f.key}`,
    label: f.label,
    type: f.type,
    required: f.required,
    options: f.options?.map((o) => ({ value: o, label: o })),
    wide: f.type === "textarea",
  };
}

export function fieldsFor(entity: EntityType, config: CrmConfig, data: CrmData): FormField[] {
  const companyOptions = data.companies
    .map((c) => ({ value: c.id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const contactOptions = data.contacts
    .map((c) => ({ value: c.id, label: contactName(c, config.locale) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const withCompany = config.modules.companies;

  let fields: FormField[];
  switch (entity) {
    case "contact":
      fields = [
        base("lastName", "field.lastName", "text", { required: true }),
        base("firstName", "field.firstName", "text", { required: true }),
        base("email", "field.email", "email"),
        base("phone", "field.phone", "phone"),
        base("jobTitle", "field.jobTitle", "text"),
        ...(withCompany
          ? [base("companyId", "field.company", "relation", { options: companyOptions })]
          : []),
        base("tags", "field.tags", "tags", {
          options: config.contactTags.map((x) => ({ value: x, label: x })),
          wide: true,
        }),
      ];
      break;
    case "company":
      fields = [
        base("name", "field.name", "text", { required: true, wide: true }),
        base("email", "field.email", "email"),
        base("phone", "field.phone", "phone"),
        base("website", "field.website", "url"),
        base("industry", "field.industry", "text"),
        base("address", "field.address", "text", { wide: true }),
      ];
      break;
    case "deal":
      fields = [
        base("title", "field.title", "text", { required: true, wide: true }),
        base("value", "field.value", "money", { required: true }),
        base("stageId", "field.stage", "select", {
          required: true,
          options: config.pipeline.map((s) => ({ value: s.id, label: s.label })),
        }),
        base("contactId", "field.contact", "relation", { options: contactOptions }),
        ...(withCompany
          ? [base("companyId", "field.company", "relation", { options: companyOptions })]
          : []),
        base("expectedCloseDate", "field.expectedCloseDate", "date"),
      ];
      break;
    case "task":
      fields = [
        base("title", "field.title", "text", { required: true, wide: true }),
        base("dueDate", "field.dueDate", "date"),
        base("priority", "field.priority", "select", {
          required: true,
          options: (["low", "normal", "high"] as const).map((p) => ({
            value: p,
            label: t(`priority.${p}`),
          })),
        }),
      ];
      break;
  }

  return [
    ...fields,
    ...config.customFields[entity].map(customToFormField),
    base("notes", "field.notes", "textarea", { wide: true }),
  ];
}

/** Rekord → űrlapértékek (minden érték string vagy boolean). */
export function toFormValues(record: Record<string, unknown>, fields: FormField[]): FormValues {
  const out: FormValues = {};
  const custom = (record.custom ?? {}) as CustomValues;
  for (const f of fields) {
    const raw = f.name.startsWith("custom.") ? custom[f.name.slice(7)] : record[f.name];
    if (f.type === "boolean") out[f.name] = raw === true;
    else if (f.type === "tags") out[f.name] = Array.isArray(raw) ? raw.join(", ") : "";
    else out[f.name] = raw === null || raw === undefined ? "" : String(raw);
  }
  return out;
}

function convert(f: FormField, v: string | boolean): unknown {
  if (f.type === "boolean") return v === true;
  const s = typeof v === "string" ? v.trim() : "";
  switch (f.type) {
    case "number":
    case "money": {
      if (s === "") return f.name.startsWith("custom.") || f.nullable ? null : 0;
      const n = Number(s.replace(/\s/g, "").replace(",", "."));
      return Number.isFinite(n) ? n : null;
    }
    case "relation":
    case "date":
      return s === "" ? null : s;
    case "tags":
      return s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    default:
      return f.name.startsWith("custom.") && s === "" ? null : s;
  }
}

/** Űrlapértékek → rekord-patch (alapmezők + `custom`). */
export function fromFormValues(values: FormValues, fields: FormField[]) {
  const patch: Record<string, unknown> = {};
  const custom: Record<string, CustomValue> = {};
  for (const f of fields) {
    const value = convert(f, values[f.name] ?? (f.type === "boolean" ? false : ""));
    if (f.name.startsWith("custom.")) custom[f.name.slice(7)] = value as CustomValue;
    else patch[f.name] = value;
  }
  patch.custom = custom;
  return patch;
}

/** Hiányzó kötelező mezők és hibás számok neve. */
export function validate(values: FormValues, fields: FormField[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.required && f.type !== "boolean" && (typeof v !== "string" || v.trim() === "")) {
      errors[f.name] = t("common.required");
    } else if ((f.type === "number" || f.type === "money") && typeof v === "string" && v.trim()) {
      if (!Number.isFinite(Number(v.replace(/\s/g, "").replace(",", "."))))
        errors[f.name] = t("common.invalidNumber");
    }
  }
  return errors;
}

/** Egyedi mező értékének megjelenítése listában/részleteknél. */
export function displayCustom(
  f: CustomFieldDef,
  value: CustomValue | undefined,
  formatMoney: (n: number) => string,
  formatDate: (s: string) => string
): string {
  if (value === null || value === undefined || value === "") return t("common.none");
  if (f.type === "boolean") return value ? t("common.yes") : t("common.no");
  if (f.type === "money" && typeof value === "number") return formatMoney(value);
  if (f.type === "date" && typeof value === "string") return formatDate(value);
  return String(value);
}
