import type { CustomFieldDef } from "@/src/crm/config";
import { displayCustom } from "@/src/crm/fields";
import { formatDate, formatMoney } from "@/src/crm/i18n";
import type { BaseRecord } from "@/src/crm/types";
import type { Column } from "./DataTable";

/** A config `showInList: true` egyedi mezőiből táblázatoszlopok. */
export function customColumns<T extends BaseRecord>(fields: CustomFieldDef[]): Column<T>[] {
  return fields
    .filter((f) => f.showInList)
    .map((f) => ({
      key: `custom.${f.key}`,
      header: f.label,
      hideOnMobile: true,
      cell: (row: T) => displayCustom(f, row.custom[f.key], formatMoney, formatDate),
    }));
}
