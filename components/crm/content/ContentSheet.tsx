import { useState } from "react";
import crmConfig from "@/crm.config";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ActivityLog } from "@/components/crm/ActivityLog";
import { PhotoManager } from "@/components/crm/PhotoManager";
import { RecordForm } from "@/components/crm/RecordForm";
import { contentFields } from "@/src/crm/content/fields";
import {
  removeContentItem,
  saveContentItem,
  slugify,
  validateSlug,
  type ContentItem,
} from "@/src/crm/content/logic";
import type { ContentTypeDef } from "@/src/crm/content/types";
import { fromFormValues, toFormValues } from "@/src/crm/fields";
import { t } from "@/src/crm/i18n";
import { folderSegment } from "@/src/crm/media";
import type { Id } from "@/src/crm/types";
import { useContent } from "./useContent";

export type ContentTarget =
  | { mode: "new"; defaults?: Record<string, unknown> }
  | { mode: "edit"; id: Id };

type Props = { def: ContentTypeDef; target: ContentTarget | null; onClose: () => void };

export function ContentSheet({ def, target, onClose }: Props) {
  const { data, content, update } = useContent(def);
  // Bezáráskor a tartalom a kicsúszó animáció végéig látható marad.
  const [lastTarget, setLastTarget] = useState(target);
  if (target !== null && target !== lastTarget) setLastTarget(target);
  const active = target ?? lastTarget;

  const labels = def.labels();
  const item =
    active?.mode === "edit" ? (content.items.find((i) => i.id === active.id) ?? null) : null;
  const fields = contentFields(def, crmConfig, data);
  const source: object | null =
    item ??
    (active?.mode === "new"
      ? { custom: {}, status: "draft", ...def.defaults?.(), ...active.defaults }
      : null);

  const updateImages = (fn: (images: ContentItem["images"]) => ContentItem["images"]) =>
    update((d) => ({
      items: d.items.map((i) =>
        i.id === item?.id ? { ...i, images: fn(i.images).slice(0, def.maxImages) } : i
      ),
    }));

  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl data-[side=right]:sm:max-w-xl">
        <SheetHeader className="pb-0">
          <SheetTitle>{item?.title ?? `${t("content.new")} ${labels.singular}`}</SheetTitle>
          <SheetDescription className="sr-only">{t("common.details")}</SheetDescription>
        </SheetHeader>
        {source && (
          <div className="flex flex-col gap-6 px-4 pb-6">
            <RecordForm
              key={item?.id ?? "new"}
              fields={fields}
              initialValues={toFormValues(source as Record<string, unknown>, fields)}
              onCancel={onClose}
              extraValidate={(values): Record<string, string> => {
                if (!def.hasPage) return {};
                const raw = String(values.slug ?? "").trim();
                if (!raw) return {};
                const err = validateSlug(raw, content.items, item?.id);
                return err
                  ? { slug: t(err === "format" ? "content.slugFormat" : "content.slugTaken") }
                  : {};
              }}
              onDelete={
                item
                  ? () => {
                      update((d, core) => removeContentItem(d, core, def.entity, item.id));
                      onClose();
                    }
                  : undefined
              }
              onSubmit={(values) => {
                let patch = fromFormValues(values, fields);
                if (def.transform) patch = def.transform(patch);
                const input = {
                  ...patch,
                  title: String(patch.title),
                  custom: { ...item?.custom, ...(patch.custom as object) },
                } as Parameters<typeof saveContentItem>[1];
                update(
                  (d) => saveContentItem(d, input, item?.id ?? null, { hasPage: def.hasPage }).data
                );
                onClose();
              }}
            />

            {item && def.maxImages > 0 && (
              <PhotoManager
                photos={item.images}
                max={def.maxImages}
                folder={`${crmConfig.media.folder}/${def.addonId}/${folderSegment(item.slug || slugify(item.title) || item.id)}`}
                onAdd={(images) => updateImages((current) => [...current, ...images])}
                onChange={(images) => updateImages(() => images)}
              />
            )}
            {item && def.Extra && <def.Extra item={item} />}
            {item && <ActivityLog related={{ type: def.entity, id: item.id }} />}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
