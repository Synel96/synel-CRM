import crmConfig from "@/crm.config";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { CrmPage, EmptyState, KpiCard, KpiGrid } from "@/components/crm/Page";
import { formatDate, formatDateTime, formatMoney, groupLabel, t } from "@/src/crm/i18n";
import { activeAddons } from "@/src/crm/addon-registry";
import { addonsInGroup } from "@/src/crm/nav";
import { dashboardStats, pipelineSummary, taskBucket } from "@/src/crm/operations";
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

export default function Page() {
  const { data } = useCrm();
  const withWidget = activeAddons().filter((a) => a.DashboardWidget);
  const businessWidgets = addonsInGroup(withWidget, "business");
  const contentWidgets = addonsInGroup(withWidget, "content");
  const stages = crmConfig.pipeline;
  const stats = dashboardStats(data, stages);
  const summary = pipelineSummary(data, stages);
  const maxTotal = Math.max(1, ...summary.map((s) => s.total));
  const { modules } = crmConfig;

  const upcoming = data.tasks
    .filter((task) => ["overdue", "today", "upcoming"].includes(taskBucket(task)))
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 6);
  const recent = [...data.activities].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  const kpis = [
    { label: t("dashboard.contacts"), value: String(stats.contacts), show: true },
    { label: t("dashboard.openDeals"), value: String(stats.openDeals), show: modules.deals },
    {
      label: t("dashboard.pipeline"),
      value: formatMoney(stats.pipelineValue),
      show: modules.deals,
    },
    {
      label: t("dashboard.weighted"),
      value: formatMoney(stats.weightedValue),
      show: modules.deals,
    },
    {
      label: t("dashboard.wonThisMonth"),
      value: formatMoney(stats.wonThisMonthValue),
      show: modules.deals,
    },
    { label: t("dashboard.overdue"), value: String(stats.overdueTasks), show: modules.tasks },
  ].filter((k) => k.show);

  return (
    <CrmPage title={t("nav.dashboard")}>
      {/* Csoportcímek csak akkor, ha van tartalomkezelő rész is – egy tisztán
          üzleti CRM-nél felesleges lenne. */}
      {contentWidgets.length > 0 && <SectionTitle>{groupLabel("business")}</SectionTitle>}

      <KpiGrid count={kpis.length}>
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} />
        ))}
      </KpiGrid>

      {businessWidgets.map((a) => (a.DashboardWidget ? <a.DashboardWidget key={a.id} /> : null))}

      <div className="grid gap-4 lg:grid-cols-2">
        {modules.deals && (
          <Card className="lg:col-span-2">
            <CardTitle>{t("dashboard.byStage")}</CardTitle>
            <ul className="flex flex-col gap-2.5">
              {summary.map(({ stage, count, total }) => (
                <li
                  key={stage.id}
                  className="grid grid-cols-[7rem_1fr] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[11rem_1fr_10rem]"
                >
                  <span className="truncate">{stage.label}</span>
                  <span className="bg-muted h-2.5 overflow-hidden rounded-full">
                    <span
                      className={
                        stage.kind === "lost"
                          ? "bg-muted-foreground/40 block h-full rounded-full"
                          : stage.kind === "won"
                            ? "block h-full rounded-full bg-emerald-500"
                            : "block h-full rounded-full bg-(--crm-accent)"
                      }
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
        )}

        {modules.tasks && (
          <Card>
            <CardTitle>{t("dashboard.upcomingTasks")}</CardTitle>
            {upcoming.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="flex flex-col divide-y">
                {upcoming.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
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
        )}

        <Card className={modules.tasks ? undefined : "lg:col-span-2"}>
          <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
          {recent.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="flex flex-col divide-y">
              {recent.map((a) => (
                <li key={a.id} className="flex flex-col gap-0.5 py-2 text-sm">
                  <span className="text-muted-foreground text-xs">
                    {t(`activity.${a.kind}`)} · {relatedLabel(data, a.related)} ·{" "}
                    {formatDateTime(a.at)}
                  </span>
                  <span className="line-clamp-2">{a.body}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

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
