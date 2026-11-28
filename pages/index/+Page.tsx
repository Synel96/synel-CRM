import { Fragment, type ReactNode } from "react";
import crmConfig from "@/crm.config";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { CrmPage, EmptyState, KpiCard, KpiGrid } from "@/components/crm/Page";
import { cn } from "@/lib/utils";
import { activeAddons } from "@/src/crm/addon-registry";
import { customFieldsOf } from "@/src/crm/config";
import {
  dashboardSettings,
  kpiValues,
  upcomingDeals,
  type CardId,
  type KpiId,
} from "@/src/crm/dashboard";
import { formatDate, formatDateTime, formatMoney, groupLabel, t } from "@/src/crm/i18n";
import { addonsInGroup } from "@/src/crm/nav";
import { pipelineSummary, taskBucket } from "@/src/crm/operations";
import { relatedLabel } from "@/src/crm/related";
import { useCrm } from "@/src/crm/store";

function SectionTitle({ children, className }: { children: string; className?: string }) {
  return (
    <h2
      className={`text-muted-foreground border-b pb-1.5 text-xs font-semibold tracking-wider uppercase ${className ?? ""}`}
    >
      {children}
    </h2>
  );
}

/** A KPI-k felirata a menüneveket és a pipeline fázisait követi. */
function kpiLabel(id: KpiId): string {
  const deals = t("nav.deals");
  const days = crmConfig.dashboard.horizonDays;
  const sumKey = crmConfig.dashboard.dealSumField;
  switch (id) {
    case "contacts":
      return t("nav.contacts");
    case "openDeals":
      return `${t("dashboard.open")} ${deals.toLowerCase()}`;
    case "pipelineValue":
      return t("dashboard.pipeline");
    case "weightedValue":
      return t("dashboard.weighted");
    case "wonThisMonth": {
      const won = crmConfig.pipeline.find((s) => s.kind === "won")?.label ?? t("dashboard.won");
      return `${won} (${t("dashboard.thisMonth")})`;
    }
    case "overdueTasks":
      return t("dashboard.overdue");
    case "upcomingDeals":
      return `${deals} – ${t("dashboard.next")} ${days} ${t("dashboard.days")}`;
    case "upcomingSum": {
      const label =
        customFieldsOf(crmConfig, "deal").find((f) => f.key === sumKey)?.label ?? sumKey ?? "";
      return `${label} (${days} ${t("dashboard.days")})`;
    }
  }
}

const MONEY_KPIS: KpiId[] = ["pipelineValue", "weightedValue", "wonThisMonth"];

export default function Page() {
  const { data } = useCrm();
  const settings = dashboardSettings(crmConfig);
  const withWidget = activeAddons().filter((a) => a.DashboardWidget);
  const businessWidgets = addonsInGroup(withWidget, "business");
  const contentWidgets = addonsInGroup(withWidget, "content");
  const values = kpiValues(data, crmConfig);
  const deals = t("nav.deals");

  const kpiRow = settings.kpis.length > 0 && (
    <KpiGrid count={settings.kpis.length}>
      {settings.kpis.map((id) => (
        <KpiCard
          key={id}
          label={kpiLabel(id)}
          value={MONEY_KPIS.includes(id) ? formatMoney(values[id]) : String(values[id])}
        />
      ))}
    </KpiGrid>
  );
  const widgets = businessWidgets.map((a) =>
    a.DashboardWidget ? <a.DashboardWidget key={a.id} /> : null
  );

  // Széles kártyák (pipeline, közelgő) két oszlopot foglalnak; ha a keskenyek
  // száma páratlan, az utolsó is kiszélesedik, hogy ne maradjon üres hely.
  const wide: CardId[] = ["pipeline", "upcomingDeals"];
  const narrow = settings.cards.filter((c) => !wide.includes(c));
  const spanLast = narrow.length % 2 === 1 ? narrow[narrow.length - 1] : null;
  const cardClass = (id: CardId) =>
    wide.includes(id) || id === spanLast ? "lg:col-span-2" : undefined;

  const cards: Record<CardId, () => ReactNode> = {
    pipeline: () => (
      <PipelineCard
        className={cardClass("pipeline")}
        title={`${deals} ${t("dashboard.byStageSuffix")}`}
      />
    ),
    upcomingDeals: () => (
      <UpcomingDealsCard
        className={cardClass("upcomingDeals")}
        title={`${t("dashboard.upcoming")} ${deals.toLowerCase()}`}
      />
    ),
    tasks: () => <TasksCard className={cardClass("tasks")} />,
    activity: () => <ActivityCard className={cardClass("activity")} />,
  };

  return (
    <CrmPage title={t("nav.dashboard")}>
      {/* Csoportcímek csak akkor, ha van tartalomkezelő rész is – egy tisztán
          üzleti CRM-nél felesleges lenne. */}
      {contentWidgets.length > 0 && <SectionTitle>{groupLabel("business")}</SectionTitle>}

      {settings.addonsFirst ? (
        <>
          {widgets}
          {kpiRow}
        </>
      ) : (
        <>
          {kpiRow}
          {widgets}
        </>
      )}

      {settings.cards.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {settings.cards.map((id) => (
            <Fragment key={id}>{cards[id]()}</Fragment>
          ))}
        </div>
      )}

      {contentWidgets.length > 0 && (
        <>
          <SectionTitle className="mt-4">{groupLabel("content")}</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {contentWidgets.map((a) =>
              a.DashboardWidget ? <a.DashboardWidget key={a.id} /> : null
            )}
          </div>
        </>
      )}
    </CrmPage>
  );
}

function PipelineCard({ className, title }: { className?: string; title: string }) {
  const { data } = useCrm();
  const summary = pipelineSummary(data, crmConfig.pipeline);
  const maxTotal = Math.max(1, ...summary.map((s) => s.total));
  return (
    <Card className={className}>
      <CardTitle>{title}</CardTitle>
      <ul className="flex flex-col gap-2.5">
        {summary.map(({ stage, count, total }) => (
          <li
            key={stage.id}
            className="grid grid-cols-[7rem_1fr] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[11rem_1fr_10rem]"
          >
            <span className="truncate">{stage.label}</span>
            <span className="bg-muted h-2.5 overflow-hidden rounded-full">
              <span
                className={cn(
                  "block h-full rounded-full",
                  stage.kind === "lost"
                    ? "bg-muted-foreground/40"
                    : stage.kind === "won"
                      ? "bg-emerald-500"
                      : "bg-(--crm-accent)"
                )}
                style={{ width: `${(total / maxTotal) * 100}%` }}
              />
            </span>
            <span className="text-muted-foreground col-start-2 tabular-nums sm:col-start-auto sm:text-right">
              {count} · {formatMoney(total)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Időpontos üzletek (pl. rendezvények) a következő napokban, dátum szerint. */
function UpcomingDealsCard({ className, title }: { className?: string; title: string }) {
  const { data } = useCrm();
  const { dealDateField, dealSumField } = crmConfig.dashboard;
  const items = upcomingDeals(data, crmConfig).slice(0, 8);
  const sumLabel = customFieldsOf(crmConfig, "deal").find((f) => f.key === dealSumField)?.label;
  const stageOf = (id: string) => crmConfig.pipeline.find((s) => s.id === id);
  return (
    <Card className={className}>
      <CardTitle>{title}</CardTitle>
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col divide-y">
          {items.map((d) => {
            const stage = stageOf(d.stageId);
            const sum = dealSumField ? d.custom[dealSumField] : null;
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                <Badge variant="accent" className="tabular-nums">
                  {formatDate(String(d.custom[dealDateField!] ?? ""))}
                </Badge>
                <a href="/deals" className="min-w-0 flex-1 truncate hover:underline">
                  {d.title}
                </a>
                {typeof sum === "number" && sumLabel && (
                  <span className="text-muted-foreground text-xs">
                    {sumLabel}: <span className="text-foreground font-medium">{sum}</span>
                  </span>
                )}
                {stage && (
                  <Badge variant={stage.kind === "won" ? "success" : "outline"}>
                    {stage.label}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function TasksCard({ className }: { className?: string }) {
  const { data } = useCrm();
  const upcoming = data.tasks
    .filter((task) => ["overdue", "today", "upcoming"].includes(taskBucket(task)))
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 6);
  return (
    <Card className={className}>
      <CardTitle>{t("dashboard.upcomingTasks")}</CardTitle>
      {upcoming.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col divide-y">
          {upcoming.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <a href="/tasks" className="truncate hover:underline">
                {task.title}
              </a>
              <Badge variant={taskBucket(task) === "overdue" ? "danger" : "outline"}>
                {formatDate(task.dueDate)}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ActivityCard({ className }: { className?: string }) {
  const { data } = useCrm();
  const recent = [...data.activities].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  return (
    <Card className={className}>
      <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
      {recent.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col divide-y">
          {recent.map((a) => (
            <li key={a.id} className="flex flex-col gap-0.5 py-2 text-sm">
              <span className="text-muted-foreground text-xs">
                {t(`activity.${a.kind}`)} · {relatedLabel(data, a.related)} · {formatDateTime(a.at)}
              </span>
              <span className="line-clamp-2">{a.body}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
