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
import { RecordForm } from "@/components/crm/RecordForm";
import { fromFormValues, toFormValues } from "@/src/crm/fields";
import { formatMoney, t } from "@/src/crm/i18n";
import { folderSegment } from "@/src/crm/media";
import { contactName } from "@/src/crm/operations";
import type { Id } from "@/src/crm/types";
import { propertyFields } from "../fields";
import { rt } from "../i18n";
import {
  generateOwnId,
  matchingSearches,
  removeProperty,
  saveProperty,
  validateOwnId,
} from "../logic";
import { MAX_PHOTOS, type Property } from "../types";
import { useRealEstate } from "../useRealEstate";
import { PhotoManager } from "@/components/crm/PhotoManager";

export type PropertyTarget = { mode: "new"; ownerContactId?: Id } | { mode: "edit"; id: Id };

type Props = { target: PropertyTarget | null; onClose: () => void };

export function PropertySheet({ target, onClose }: Props) {
  const { data, re, update } = useRealEstate();
  // Bezáráskor a tartalom a kicsúszó animáció végéig látható marad.
  const [lastTarget, setLastTarget] = useState(target);
  if (target !== null && target !== lastTarget) setLastTarget(target);
  const active = target ?? lastTarget;

  const property =
    active?.mode === "edit" ? (re.properties.find((p) => p.id === active.id) ?? null) : null;
  const fields = propertyFields(data);
  const source: object | null =
    property ??
    (active?.mode === "new"
      ? {
          custom: {},
          listingType: "sale",
          propertyType: "flat",
          status: "draft",
          hideAddress: true,
          ownerContactId: active.ownerContactId ?? null,
          ownId: generateOwnId(re.properties),
        }
      : null);

  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl data-[side=right]:sm:max-w-2xl">
        <SheetHeader className="pb-0">
          <SheetTitle>
            {property?.title ?? `${t("common.new")}: ${rt("nav.properties").toLowerCase()}`}
          </SheetTitle>
          <SheetDescription className="sr-only">{t("common.details")}</SheetDescription>
        </SheetHeader>
        {source && (
          <div className="flex flex-col gap-6 px-4 pb-6">
            <RecordForm
              key={property?.id ?? "new"}
              fields={fields}
              initialValues={toFormValues(source as Record<string, unknown>, fields)}
              onCancel={onClose}
              extraValidate={(values): Record<string, string> => {
                const err = validateOwnId(String(values.ownId).trim(), re.properties, property?.id);
                return err
                  ? { ownId: rt(err === "format" ? "f.ownIdFormat" : "f.ownIdTaken") }
                  : {};
              }}
              onDelete={
                property
                  ? () => {
                      update((d, core) => removeProperty(d, core, property.id));
                      onClose();
                    }
                  : undefined
              }
              onSubmit={(values) => {
                const patch = fromFormValues(values, fields) as Partial<Property>;
                const input = {
                  ...(property ?? { photos: [] }),
                  ...patch,
                  ownId: String(patch.ownId).trim(),
                  custom: { ...property?.custom, ...patch.custom },
                } as Property;
                update((d) => saveProperty(d, input, property?.id ?? null).data);
                onClose();
              }}
            />

            {property && (
              <>
                <PhotoManager
                  photos={property.photos}
                  max={MAX_PHOTOS}
                  title={rt("photos.propertyTitle")}
                  folder={`${crmConfig.media.folder}/properties/${folderSegment(property.ownId)}`}
                  onAdd={(photos) =>
                    // A legfrissebb adatra fűzünk, így a párhuzamos feltöltések nem vesznek el.
                    update((d) => {
                      const current = d.properties.find((p) => p.id === property.id);
                      if (!current) return d;
                      const next = [...current.photos, ...photos].slice(0, MAX_PHOTOS);
                      return saveProperty(d, { ...current, photos: next }, current.id).data;
                    })
                  }
                  onChange={(photos) =>
                    update((d) => {
                      const current = d.properties.find((p) => p.id === property.id);
                      return current ? saveProperty(d, { ...current, photos }, current.id).data : d;
                    })
                  }
                />
                <Interested property={property} />
                <ActivityLog related={{ type: "property", id: property.id }} />
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Interested({ property }: { property: Property }) {
  const { data, re } = useRealEstate();
  const found = matchingSearches(re, property);
  const name = (id: Id | null) => {
    const c = data.contacts.find((x) => x.id === id);
    return c ? contactName(c, crmConfig.locale) : t("common.none");
  };
  return (
    <section className="flex flex-col gap-2 border-t pt-4">
      <h3 className="text-sm font-semibold">
        {rt("match.interested")}{" "}
        <span className="text-muted-foreground font-normal">({found.length})</span>
      </h3>
      {found.length === 0 ? (
        <p className="text-muted-foreground text-sm">{rt("match.none")}</p>
      ) : (
        <ul className="divide-y text-sm">
          {found.map((s) => (
            <li key={s.id} className="flex justify-between gap-3 py-1.5">
              <a href={`/searches?id=${s.id}`} className="hover:underline">
                {name(s.contactId)}
              </a>
              <span className="text-muted-foreground">
                {s.priceMax !== null ? `≤ ${formatMoney(s.priceMax)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
