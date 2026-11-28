import { ArrowDownIcon, ArrowUpIcon, PlusIcon, StarIcon } from "lucide-react";
import { useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/crm/DataTable";
import { CrmPage, accentButton } from "@/components/crm/Page";
import { cn } from "@/lib/utils";
import { isAddonActive } from "@/src/crm/addon-registry";
import {
  isScheduled,
  moveItem,
  setStatus,
  sortedItems,
  type ContentItem,
} from "@/src/crm/content/logic";
import type { ContentTypeDef } from "@/src/crm/content/types";
import { formatDateTime, navLabel, t } from "@/src/crm/i18n";
import { matchesQuery } from "@/src/crm/operations";
import { ContentSheet, type ContentTarget } from "./ContentSheet";
import { useContent } from "./useContent";

/** Egy tartalomtípus listaoldala (a bővítmény +Page.tsx-e csak ezt rendereli). */
export function ContentListPage({ def }: { def: ContentTypeDef }) {
  const { data, content, update } = useContent(def);
  const { urlParsed } = usePageContext();
  const labels = def.labels();
  const [target, setTarget] = useState<ContentTarget | null>(() =>
    urlParsed.search.id ? { mode: "edit", id: urlParsed.search.id } : null
  );
  const [query, setQuery] = useState("");
  const [status, setStatusFilter] = useState("");

  const filtered = Boolean(query || status);
  const rows = sortedItems(content.items)
    .filter((i) => !status || i.status === status)
    .filter((i) => matchesQuery(query, i.title, i.slug));

  const columns: Column<ContentItem>[] = [
    {
      key: "title",
      header: labels.title,
      cell: (i) => (
        <span className="flex flex-col">
          <span className="flex items-center gap-1.5">
            {i.featured && (
              <StarIcon
                className="size-3.5 fill-amber-400 text-amber-400"
                aria-label={t("content.featured")}
              />
            )}
            {i.title}
          </span>
          {def.preview && (
            <span className="text-muted-foreground line-clamp-1 text-xs font-normal">
              {def.preview(i)}
            </span>
          )}
        </span>
      ),
    },
    ...(def.columns?.(data) ?? []),
    {
      key: "status",
      header: t("content.status"),
      cell: (i) => (
        <button
          type="button"
          onClick={() =>
            update((d) => setStatus(d, i.id, i.status === "published" ? "draft" : "published"))
          }
          title={i.status === "published" ? t("content.unpublish") : t("content.publish")}
          className="rounded-full"
        >
          {isScheduled(i) ? (
            <Badge variant="accent">
              {t("content.scheduled")} · {formatDateTime(i.publishedAt!)}
            </Badge>
          ) : (
            <Badge variant={i.status === "published" ? "success" : "outline"}>
              {i.status === "published" ? t("content.published") : t("content.draft")}
            </Badge>
          )}
        </button>
      ),
    },
    {
      key: "order",
      header: t("content.order"),
      hideOnMobile: true,
      className: "w-24",
      cell: (i) => {
        const idx = rows.findIndex((r) => r.id === i.id);
        return (
          <span className={cn("flex", filtered && "invisible")}>
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={idx === 0}
              aria-label={`${t("content.moveUp")}: ${i.title}`}
              onClick={() => update((d) => moveItem(d, i.id, -1))}
            >
              <ArrowUpIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={idx === rows.length - 1}
              aria-label={`${t("content.moveDown")}: ${i.title}`}
              onClick={() => update((d) => moveItem(d, i.id, 1))}
            >
              <ArrowDownIcon />
            </Button>
          </span>
        );
      },
    },
  ];

  return (
    <CrmPage
      title={navLabel(def.addonId, labels.plural)}
      enabled={isAddonActive(def.addonId)}
      actions={
        <Button className={accentButton} onClick={() => setTarget({ mode: "new" })}>
          <PlusIcon /> {t("content.new")} {labels.singular}
        </Button>
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.search")}
          aria-label={t("common.search")}
          className="sm:max-w-xs"
        />
        <NativeSelect
          value={status}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label={t("content.status")}
          className="sm:w-auto"
        >
          <option value="">{t("content.allStatuses")}</option>
          <option value="published">{t("content.published")}</option>
          <option value="draft">{t("content.draft")}</option>
        </NativeSelect>
        {filtered && (
          <p className="text-muted-foreground text-xs sm:ml-auto">{t("content.reorderHint")}</p>
        )}
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        rowLabel={(i) => i.title}
        filtered={filtered}
        onOpen={(i) => setTarget({ mode: "edit", id: i.id })}
      />

      <ContentSheet def={def} target={target} onClose={() => setTarget(null)} />
    </CrmPage>
  );
}
