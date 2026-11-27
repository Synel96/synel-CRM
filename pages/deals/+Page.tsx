import { PlusIcon } from "lucide-react";
import { useState } from "react";
import crmConfig from "@/crm.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { ActivityLog } from "@/components/crm/ActivityLog";
import { EntitySheet, type SheetTarget } from "@/components/crm/EntitySheet";
import { CrmPage, accentButton } from "@/components/crm/Page";
import { cn } from "@/lib/utils";
import { displayCustom } from "@/src/crm/fields";
import { formatDate, formatMoney, t } from "@/src/crm/i18n";
import { contactName, matchesQuery } from "@/src/crm/operations";
import { useCrm } from "@/src/crm/store";
import type { Deal } from "@/src/crm/types";

export default function Page() {
  const { data, store } = useCrm();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<SheetTarget | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const listFields = crmConfig.customFields.deal.filter((f) => f.showInList);

  const contactLabel = (id: string | null) => {
    const c = data.contacts.find((x) => x.id === id);
    return c ? contactName(c, crmConfig.locale) : "";
  };
  const companyLabel = (id: string | null) => data.companies.find((x) => x.id === id)?.name ?? "";

  const deals = data.deals.filter((d) =>
    matchesQuery(query, d.title, contactLabel(d.contactId), companyLabel(d.companyId))
  );

  return (
    <CrmPage
      title={t("nav.deals")}
      enabled={crmConfig.modules.deals}
      actions={
        <Button
          className={accentButton}
          onClick={() =>
            setTarget({ mode: "new", defaults: { stageId: crmConfig.pipeline[0].id, value: 0 } })
          }
        >
          <PlusIcon /> {t("common.new")}
        </Button>
      }
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.search")}
          aria-label={t("common.search")}
          className="sm:max-w-xs"
        />
        <p className="text-muted-foreground hidden text-xs md:block">{t("deals.dragHint")}</p>
      </div>

      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {crmConfig.pipeline.map((stage) => {
          const items = deals.filter((d) => d.stageId === stage.id);
          const total = items.reduce((s, d) => s + d.value, 0);
          return (
            <section
              key={stage.id}
              aria-label={stage.label}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(stage.id);
              }}
              onDragLeave={() => setDragOver((s) => (s === stage.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/plain");
                const deal = data.deals.find((d) => d.id === id);
                if (deal && deal.stageId !== stage.id) store.moveDeal(id, stage.id);
              }}
              className={cn(
                "bg-muted/40 flex w-72 shrink-0 snap-start flex-col gap-2 rounded-xl border p-2 transition-colors",
                dragOver === stage.id && "border-(--crm-accent) bg-(--crm-accent)/8"
              )}
            >
              <header className="flex items-baseline justify-between gap-2 px-1 pt-1">
                <h2 className="truncate text-sm font-semibold">
                  {stage.label}{" "}
                  <span className="text-muted-foreground font-normal">({items.length})</span>
                </h2>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatMoney(total)}
                </span>
              </header>
              <ul className="flex min-h-16 flex-col gap-2">
                {items.map((d) => (
                  <DealCard
                    key={d.id}
                    deal={d}
                    subtitle={[contactLabel(d.contactId), companyLabel(d.companyId)]
                      .filter(Boolean)
                      .join(" · ")}
                    badges={listFields.map((f) =>
                      displayCustom(f, d.custom[f.key], formatMoney, formatDate)
                    )}
                    onOpen={() => setTarget({ mode: "edit", id: d.id })}
                    onMove={(stageId) => store.moveDeal(d.id, stageId)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <EntitySheet
        entity="deal"
        collection="deals"
        target={target}
        onClose={() => setTarget(null)}
        title={(d) => d?.title ?? `${t("common.new")}: ${t("nav.deals").toLowerCase()}`}
      >
        {(d) => <ActivityLog related={{ type: "deal", id: d.id }} />}
      </EntitySheet>
    </CrmPage>
  );
}

function DealCard({
  deal,
  subtitle,
  badges,
  onOpen,
  onMove,
}: {
  deal: Deal;
  subtitle: string;
  badges: string[];
  onOpen: () => void;
  onMove: (stageId: string) => void;
}) {
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", deal.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="bg-card cursor-grab rounded-lg border p-3 shadow-xs active:cursor-grabbing"
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left text-sm font-medium hover:text-(--crm-accent)"
      >
        {deal.title}
      </button>
      {subtitle && <p className="text-muted-foreground mt-0.5 truncate text-xs">{subtitle}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-semibold tabular-nums">{formatMoney(deal.value)}</span>
        {deal.expectedCloseDate && (
          <Badge variant="outline">{formatDate(deal.expectedCloseDate)}</Badge>
        )}
        {badges
          .filter((b) => b !== t("common.none"))
          .map((b, i) => (
            <Badge key={i} variant="accent">
              {b}
            </Badge>
          ))}
      </div>
      {/* Húzás helyett (érintőképernyő, billentyűzet): fázisváltás listából */}
      <NativeSelect
        value={deal.stageId}
        onChange={(e) => onMove(e.target.value)}
        aria-label={`${t("field.stage")}: ${deal.title}`}
        className="mt-2 h-7 text-xs"
      >
        {crmConfig.pipeline.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </NativeSelect>
    </li>
  );
}
