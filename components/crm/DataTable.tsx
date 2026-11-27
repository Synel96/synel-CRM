import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/src/crm/i18n";
import { EmptyState } from "./Page";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Kisebb képernyőn elrejthető oszlop. */
  hideOnMobile?: boolean;
  className?: string;
};

type Props<T extends { id: string }> = {
  rows: T[];
  columns: Column<T>[];
  onOpen: (row: T) => void;
  /** Az első oszlop szövege, a gomb akadálymentes neve. */
  rowLabel: (row: T) => string;
  filtered?: boolean;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  onOpen,
  rowLabel,
  filtered,
}: Props<T>) {
  if (rows.length === 0) {
    return <EmptyState>{filtered ? t("common.noResults") : t("common.empty")}</EmptyState>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "px-3 py-2 font-medium whitespace-nowrap",
                  c.hideOnMobile && "hidden md:table-cell",
                  c.className
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/40 transition-colors">
              {columns.map((c, i) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-3 py-2.5 align-middle",
                    c.hideOnMobile && "hidden md:table-cell",
                    c.className
                  )}
                >
                  {i === 0 ? (
                    <button
                      type="button"
                      onClick={() => onOpen(row)}
                      className="text-left font-medium hover:text-(--crm-accent) hover:underline"
                      aria-label={`${t("common.edit")}: ${rowLabel(row)}`}
                    >
                      {c.cell(row)}
                    </button>
                  ) : (
                    c.cell(row)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
