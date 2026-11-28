import { Card } from "@/components/ui/card";
import { contentCounts } from "@/src/crm/content/logic";
import type { ContentTypeDef } from "@/src/crm/content/types";
import { navLabel, t } from "@/src/crm/i18n";
import { useContent } from "./useContent";

/** Kis kártya az Áttekintés „Tartalomkezelés” részébe. */
export function ContentDashboardCard({ def }: { def: ContentTypeDef }) {
  const { content } = useContent(def);
  const counts = contentCounts(content);
  const Icon = def.icon;
  const stats = def.stats?.(content.items) ?? [];
  return (
    <a href={`/${def.addonId}`} className="group">
      <Card className="h-full gap-2 transition-colors group-hover:border-(--crm-accent)">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="text-muted-foreground size-4" />
          {navLabel(def.addonId, def.labels().plural)}
        </p>
        <p className="text-2xl font-semibold tabular-nums">
          {counts.published}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            {t("content.publishedCount")}
          </span>
        </p>
        <p className="text-muted-foreground text-xs">
          {counts.drafts} {t("content.draftCount")}
          {stats.map((s) => (
            <span key={s.label}>
              {" · "}
              {s.label}: <span className="text-foreground font-medium">{s.value}</span>
            </span>
          ))}
        </p>
      </Card>
    </a>
  );
}
