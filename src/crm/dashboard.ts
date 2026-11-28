/*
 * Az Áttekintés tartalma: mely számok (KPI-k) és kártyák jelenjenek meg, és
 * milyen sorrendben. Az üzlettípus-profil adja (src/crm/industries.ts), az
 * ügyfél configja (`dashboard`) felülírhatja. A számítás tiszta függvény.
 */
import type { CrmConfig } from "./config";
import { dashboardStats, toDateKey } from "./operations";
import type { CrmData, Deal } from "./types";

export const KPI_IDS = [
  "contacts",
  "openDeals",
  "pipelineValue",
  "weightedValue",
  "wonThisMonth",
  "overdueTasks",
  /** Időpontos üzletek (pl. rendezvények) a következő N napban – `dealDateField` kell. */
  "upcomingDeals",
  /** Ezek egy szám-mezőjének összege (pl. vendégek) – `dealSumField` kell. */
  "upcomingSum",
] as const;
export type KpiId = (typeof KPI_IDS)[number];

export const CARD_IDS = ["pipeline", "upcomingDeals", "tasks", "activity"] as const;
export type CardId = (typeof CARD_IDS)[number];

export const DEFAULT_KPIS: KpiId[] = [
  "contacts",
  "openDeals",
  "pipelineValue",
  "weightedValue",
  "wonThisMonth",
  "overdueTasks",
];
export const DEFAULT_CARDS: CardId[] = ["pipeline", "tasks", "activity"];

/** A config `dashboard` része, alapértelmezésekkel kitöltve. */
export function dashboardSettings(config: CrmConfig) {
  const d = config.dashboard;
  const needsDate = (id: string) =>
    (id === "upcomingDeals" || id === "upcomingSum") && !d.dealDateField;
  const usable = <T extends string>(ids: T[]) =>
    ids.filter((id) => {
      if (needsDate(id)) return false;
      if (id === "upcomingSum" && !d.dealSumField) return false;
      if (
        [
          "openDeals",
          "pipelineValue",
          "weightedValue",
          "wonThisMonth",
          "upcomingDeals",
          "upcomingSum",
          "pipeline",
        ].includes(id)
      )
        return config.modules.deals;
      if (id === "overdueTasks" || id === "tasks") return config.modules.tasks;
      return true;
    });
  return {
    kpis: usable(d.kpis ?? DEFAULT_KPIS),
    cards: usable(d.cards ?? DEFAULT_CARDS),
    addonsFirst: d.addonsFirst,
    horizonDays: d.horizonDays,
    dealDateField: d.dealDateField,
    dealSumField: d.dealSumField,
  };
}

/**
 * Időpontos üzletek a következő `days` napban (ma is beleértve), dátum
 * szerint rendezve. Az elvesztett/lemondott üzletek kimaradnak.
 */
export function upcomingDeals(
  data: CrmData,
  config: CrmConfig,
  now = new Date(),
  days = config.dashboard.horizonDays
): Deal[] {
  const field = config.dashboard.dealDateField;
  if (!field) return [];
  const lost = new Set(config.pipeline.filter((s) => s.kind === "lost").map((s) => s.id));
  const from = toDateKey(now);
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  const to = toDateKey(end);
  const dateOf = (d: Deal) =>
    typeof d.custom[field] === "string" ? (d.custom[field] as string) : "";
  return data.deals
    .filter((d) => !lost.has(d.stageId))
    .filter((d) => {
      const at = dateOf(d);
      return at >= from && at <= to;
    })
    .sort((a, b) => dateOf(a).localeCompare(dateOf(b)));
}

/** Egy szám-mező összege az adott üzleteken (pl. várható vendégek). */
export function sumField(deals: Deal[], field: string | undefined): number {
  if (!field) return 0;
  return deals.reduce(
    (n, d) => n + (typeof d.custom[field] === "number" ? (d.custom[field] as number) : 0),
    0
  );
}

/** A KPI-k nyers értékei (formázás és felirat nélkül). */
export function kpiValues(
  data: CrmData,
  config: CrmConfig,
  now = new Date()
): Record<KpiId, number> {
  const stats = dashboardStats(data, config.pipeline, now);
  const upcoming = upcomingDeals(data, config, now);
  return {
    contacts: stats.contacts,
    openDeals: stats.openDeals,
    pipelineValue: stats.pipelineValue,
    weightedValue: stats.weightedValue,
    wonThisMonth: stats.wonThisMonthValue,
    overdueTasks: stats.overdueTasks,
    upcomingDeals: upcoming.length,
    upcomingSum: sumField(upcoming, config.dashboard.dealSumField),
  };
}
