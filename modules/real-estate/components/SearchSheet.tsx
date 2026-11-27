import { useState } from "react";
import crmConfig from "@/crm.config";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RecordForm } from "@/components/crm/RecordForm";
import { fromFormValues, toFormValues } from "@/src/crm/fields";
import { formatMoney, t } from "@/src/crm/i18n";
import { contactName } from "@/src/crm/operations";
import type { Id } from "@/src/crm/types";
import { searchFields } from "../fields";
import { rt } from "../i18n";
import { matchingProperties, removeSearch, saveSearch, shortAddress } from "../logic";
import type { BuyerSearch } from "../types";
import { useRealEstate } from "../useRealEstate";

export type SearchTarget = { mode: "new"; contactId?: Id } | { mode: "edit"; id: Id };

type Props = { target: SearchTarget | null; onClose: () => void };

export function SearchSheet({ target, onClose }: Props) {
  const { data, re, update } = useRealEstate();
  const [lastTarget, setLastTarget] = useState(target);
  if (target !== null && target !== lastTarget) setLastTarget(target);
  const active = target ?? lastTarget;

  const search =
    active?.mode === "edit" ? (re.searches.find((s) => s.id === active.id) ?? null) : null;
  const fields = searchFields(data);
  const source: object | null =
    search ??
    (active?.mode === "new"
      ? { custom: {}, listingType: "sale", active: true, contactId: active.contactId ?? null }
      : null);
  const contact = data.contacts.find((c) => c.id === search?.contactId);

  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl data-[side=right]:sm:max-w-xl">
        <SheetHeader className="pb-0">
          <SheetTitle>
            {contact
              ? `${rt("nav.searches")}: ${contactName(contact, crmConfig.locale)}`
              : `${t("common.new")}: ${rt("nav.searches").toLowerCase()}`}
          </SheetTitle>
          <SheetDescription className="sr-only">{t("common.details")}</SheetDescription>
        </SheetHeader>
        {source && (
          <div className="flex flex-col gap-6 px-4 pb-6">
            <RecordForm
              key={search?.id ?? "new"}
              fields={fields}
              initialValues={toFormValues(source as Record<string, unknown>, fields)}
              onCancel={onClose}
              onDelete={
                search
                  ? () => {
                      update((d) => removeSearch(d, search.id));
                      onClose();
                    }
                  : undefined
              }
              onSubmit={(values) => {
                const patch = fromFormValues(values, fields) as Partial<BuyerSearch>;
                const input = {
                  ...search,
                  ...patch,
                  custom: { ...search?.custom, ...patch.custom },
                } as BuyerSearch;
                update((d) => saveSearch(d, input, search?.id ?? null));
                onClose();
              }}
            />
            {search && <Matches search={search} />}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Matches({ search }: { search: BuyerSearch }) {
  const { re } = useRealEstate();
  const found = matchingProperties(re, search);
  return (
    <section className="flex flex-col gap-2 border-t pt-4">
      <h3 className="text-sm font-semibold">
        {rt("match.properties")}{" "}
        <span className="text-muted-foreground font-normal">({found.length})</span>
      </h3>
      {found.length === 0 ? (
        <p className="text-muted-foreground text-sm">{rt("match.none")}</p>
      ) : (
        <ul className="divide-y text-sm">
          {found.map((p) => (
            <li key={p.id} className="flex justify-between gap-3 py-1.5">
              <a href={`/properties?id=${p.id}`} className="min-w-0 hover:underline">
                <span className="block truncate">{p.title}</span>
                <span className="text-muted-foreground block text-xs">
                  {shortAddress(p, false)}
                </span>
              </a>
              <span className="shrink-0 tabular-nums">{formatMoney(p.price)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
