import { useState, type ReactNode } from "react";
import crmConfig from "@/crm.config";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { EntityType } from "@/src/crm/config";
import { fieldsFor, fromFormValues, toFormValues } from "@/src/crm/fields";
import { t } from "@/src/crm/i18n";
import { useCrm } from "@/src/crm/store";
import type { Collection, Id, NewRecord, RecordOf } from "@/src/crm/types";
import { RecordForm } from "./RecordForm";

export type SheetTarget =
  | { mode: "new"; defaults?: Record<string, unknown> }
  | { mode: "edit"; id: Id };

type Props<C extends Collection> = {
  entity: EntityType;
  collection: C;
  target: SheetTarget | null;
  onClose: () => void;
  title: (record: RecordOf<C> | null) => string;
  /** Plusz tartalom a szerkesztett rekordhoz (pl. tevékenységek). */
  children?: (record: RecordOf<C>) => ReactNode;
};

export function EntitySheet<C extends Collection>({
  entity,
  collection,
  target,
  onClose,
  title,
  children,
}: Props<C>) {
  const { data, store } = useCrm();
  // Bezáráskor a tartalom a kicsúszó animáció végéig látható marad.
  const [lastTarget, setLastTarget] = useState(target);
  if (target !== null && target !== lastTarget) setLastTarget(target);
  const active = target ?? lastTarget;

  const records = data[collection] as RecordOf<C>[];
  const record = active?.mode === "edit" ? (records.find((r) => r.id === active.id) ?? null) : null;
  const fields = fieldsFor(entity, crmConfig, data);
  const source =
    record ?? (active?.mode === "new" ? { custom: {}, ...(active.defaults ?? {}) } : null);

  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl data-[side=right]:sm:max-w-xl">
        <SheetHeader className="pb-0">
          <SheetTitle>{title(record)}</SheetTitle>
          <SheetDescription className="sr-only">{t("common.details")}</SheetDescription>
        </SheetHeader>
        {source && (
          <div className="flex flex-col gap-6 px-4 pb-6">
            <RecordForm
              key={record?.id ?? "new"}
              fields={fields}
              initialValues={toFormValues(source as Record<string, unknown>, fields)}
              onCancel={onClose}
              onDelete={
                record
                  ? () => {
                      store.remove(collection, record.id);
                      onClose();
                    }
                  : undefined
              }
              onSubmit={(values) => {
                const patch = fromFormValues(values, fields);
                if (record) {
                  // Az űrlapon nem szereplő egyedi mezőket (pl. régi config) megőrizzük.
                  patch.custom = { ...record.custom, ...(patch.custom as object) };
                  if (
                    collection === "deals" &&
                    patch.stageId !== (record as { stageId?: string }).stageId
                  ) {
                    store.moveDeal(record.id, String(patch.stageId));
                  }
                  store.update(collection, record.id, patch as Partial<NewRecord<C>>);
                } else {
                  if (collection === "deals") {
                    const kind = crmConfig.pipeline.find((s) => s.id === patch.stageId)?.kind;
                    patch.closedAt = kind && kind !== "open" ? new Date().toISOString() : null;
                  }
                  store.create(collection, {
                    ...defaultsFor(collection),
                    ...patch,
                  } as NewRecord<C>);
                }
                onClose();
              }}
            />
            {record && children?.(record)}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Az űrlapon nem szereplő, de kötelező rekordmezők kezdőértékei. */
function defaultsFor(collection: Collection): Record<string, unknown> {
  switch (collection) {
    case "contacts":
      return { companyId: null, tags: [] };
    case "deals":
      return { contactId: null, companyId: null, closedAt: null };
    case "tasks":
      return { done: false, related: null, priority: "normal" };
    default:
      return {};
  }
}
