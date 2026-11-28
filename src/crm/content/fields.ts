import { customFieldsOf, type CrmConfig } from "../config";
import { customToFormField, type FormField } from "../fields";
import { t } from "../i18n";
import type { CrmData } from "../types";
import type { ContentItem } from "./logic";
import type { ContentTypeDef } from "./types";

/**
 * Egy tartalomtípus teljes űrlapja: cím → a típus saját mezői → a configban
 * megadott egyedi mezők → közös mezők (státusz, kiemelt, URL, SEO).
 */
export function contentFields(
  def: ContentTypeDef,
  config: CrmConfig,
  core: CrmData,
  item: ContentItem | null = null
): FormField[] {
  const field = (f: Omit<FormField, "required"> & { required?: boolean }): FormField => ({
    required: false,
    ...f,
  });
  return [
    field({ name: "title", label: def.labels().title, type: "text", required: true, wide: true }),
    ...def.fields(core, item),
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
            help: t("content.slugHelp"),
            wide: true,
          }),
          field({
            name: "seoTitle",
            label: t("content.seoTitle"),
            type: "text",
            wide: true,
            help: t("content.seoTitleHelp"),
          }),
          field({
            name: "seoDescription",
            label: t("content.seoDescription"),
            type: "textarea",
            hint: t("content.seoHint"),
            help: t("content.seoDescriptionHelp"),
            wide: true,
          }),
        ]
      : []),
  ];
}

/**
 * Egy másik tartalmi bővítmény elemei választólistaként (pl. a projekthez
 * kapcsolódó szolgáltatások). Ha a bővítmény nincs bekapcsolva, üres lista.
 */
export function contentOptions(core: CrmData, addonId: string) {
  const data = core.addons[addonId] as { items?: ContentItem[] } | undefined;
  return [...(data?.items ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => ({ value: i.id, label: i.title }));
}
