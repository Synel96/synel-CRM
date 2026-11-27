import { useEffect, type ReactNode } from "react";
import crmConfig from "@/crm.config";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { t } from "@/src/crm/i18n";
import { useCrm } from "@/src/crm/store";

type Props = {
  title: string;
  actions?: ReactNode;
  /** Ha a modul ki van kapcsolva a configban, üzenetet mutat. */
  enabled?: boolean;
  children: ReactNode;
};

/** Oldalkeret: cím, akciógombok, betöltési állapot, kikapcsolt modul. */
export function CrmPage({ title, actions, enabled = true, children }: Props) {
  const { status } = useCrm();

  useEffect(() => {
    document.title = `${title} | ${crmConfig.brand.name}`;
  }, [title]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {enabled && status === "ready" && actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {!enabled ? (
        <p className="text-muted-foreground">{t("common.moduleDisabled")}</p>
      ) : status === "loading" ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : (
        children
      )}
    </div>
  );
}

export function EmptyState({ children }: { children?: ReactNode }) {
  return (
    <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
      {children ?? t("common.empty")}
    </div>
  );
}

/**
 * KPI-dobozok rácsa: az oszlopszám a dobozok számához igazodik, így a sor
 * mindig kitöltött (pl. kikapcsolt Üzletek modulnál sem marad üres hely,
 * és 6 doboz sem tör 5 + 1-re).
 */
export function KpiGrid({ count, children }: { count: number; children: ReactNode }) {
  const cols = Math.max(1, Math.min(count, 6));
  return (
    <div
      style={{ ["--kpi-cols" as string]: cols }}
      className={
        cols <= 4
          ? "grid grid-cols-2 gap-3 lg:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]"
          : "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]"
      }
    >
      {children}
    </div>
  );
}

/** Egy KPI-doboz: felirat + érték (hosszú összeg kis helyen sem lóg ki). */
export function KpiCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  // Container query: a betűméret a doboz szélességéhez igazodik, így a
  // hosszú összeg (pl. „19 000 000 Ft”) keskeny dobozban sem törik és nem lóg ki.
  return (
    <Card className={cn("@container min-w-0 gap-1", className)}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-base font-semibold whitespace-nowrap tabular-nums @[9rem]:text-lg @[11rem]:text-xl">
        {value}
      </p>
    </Card>
  );
}

export const accentButton = "bg-(--crm-accent) text-white hover:bg-(--crm-accent)/85";
