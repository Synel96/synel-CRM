import { customFieldsOf, type CrmConfig } from "../config";
import { customToFormField, type FormField } from "../fields";
import { t } from "../i18n";
import type { CrmData } from "../types";
import type { ContentTypeDef } from "./types";

/**
 * Egy tartalomtípus teljes űrlapja: cím → a típus saját mezői → a configban
 * megadott egyedi mezők → közös mezők (státusz, kiemelt, URL, SEO).
 */
export function contentFields(def: ContentTypeDef, config: CrmConfig, core: CrmData): FormField[] {
  const field = (f: Omit<FormField, "required"> & { required?: boolean }): FormField => ({
    required: false,
    ...f,
  });
  return [
    field({ name: "title", label: def.labels().title, type: "text", required: true, wide: true }),
    ...def.fields(core),
    ...customFieldsOf(config, def.entity).map(customToFormField),
    field({
      name: "status",
      label: t("content.status"),
      type: "select",
      required: true,
      options: [
        { value: "draft", label: t("content.draft") },
        { value: "published", label: t("content.published") },
      ],
    }),
    field({ name: "featured", label: t("content.featured"), type: "boolean" }),
    ...(def.hasPage
      ? [
          field({
            name: "slug",
            label: t("content.slug"),
            type: "text",
            hint: t("content.slugHint"),
            wide: true,
          }),
          field({ name: "seoTitle", label: t("content.seoTitle"), type: "text", wide: true }),
          field({
            name: "seoDescription",
            label: t("content.seoDescription"),
            type: "textarea",
            hint: t("content.seoHint"),
            wide: true,
          }),
        ]
      : []),
  ];
}
