import { PlusIcon } from "lucide-react";
import { useState } from "react";
import crmConfig from "@/crm.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntitySheet, type SheetTarget } from "@/components/crm/EntitySheet";
import { CrmPage, EmptyState, accentButton } from "@/components/crm/Page";
import { cn } from "@/lib/utils";
import { formatDate, t } from "@/src/crm/i18n";
import { taskBucket, type TaskBucket } from "@/src/crm/operations";
import { relatedLabel } from "@/src/crm/related";
import { useCrm } from "@/src/crm/store";
import type { Task } from "@/src/crm/types";

const BUCKETS: TaskBucket[] = ["overdue", "today", "upcoming", "someday", "done"];
const PRIORITY_VARIANT = { high: "danger", normal: "outline", low: "default" } as const;

export default function Page() {
  const { data, store } = useCrm();
  const [quickTitle, setQuickTitle] = useState("");
  const [target, setTarget] = useState<SheetTarget | null>(null);

  const grouped = new Map<TaskBucket, Task[]>(BUCKETS.map((b) => [b, []]));
  for (const task of data.tasks) grouped.get(taskBucket(task))!.push(task);
  for (const list of grouped.values()) {
    list.sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  }

  return (
    <CrmPage
      title={t("nav.tasks")}
      enabled={crmConfig.modules.tasks}
      actions={
        <Button
          className={accentButton}
          onClick={() => setTarget({ mode: "new", defaults: { priority: "normal" } })}
        >
          <PlusIcon /> {t("common.new")}
        </Button>
      }
    >
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const title = quickTitle.trim();
          if (!title) return;
          store.create("tasks", {
            title,
            dueDate: null,
            done: false,
            priority: "normal",
            related: null,
            notes: "",
          });
          setQuickTitle("");
        }}
      >
        <Input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder={t("tasks.quickAdd")}
          aria-label={t("tasks.quickAdd")}
          className="max-w-md"
        />
        <Button type="submit" variant="outline" disabled={!quickTitle.trim()}>
          {t("activity.add")}
        </Button>
      </form>

      {data.tasks.length === 0 && <EmptyState />}

      {BUCKETS.map((bucket) => {
        const list = grouped.get(bucket)!;
        if (list.length === 0) return null;
        return (
          <section key={bucket} className="flex flex-col gap-2">
            <h2
              className={cn(
                "text-sm font-semibold",
                bucket === "overdue" && "text-destructive",
                bucket === "done" && "text-muted-foreground"
              )}
            >
              {t(`tasks.${bucket}`)} <span className="font-normal">({list.length})</span>
            </h2>
            <ul className="divide-y rounded-xl border">
              {list.map((task) => (
                <li key={task.id} className="flex items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(e) => store.update("tasks", task.id, { done: e.target.checked })}
                    aria-label={task.title}
                    className="size-4 shrink-0 accent-(--crm-accent)"
                  />
                  <button
                    type="button"
                    onClick={() => setTarget({ mode: "edit", id: task.id })}
                    className={cn(
                      "min-w-0 flex-1 text-left text-sm hover:underline",
                      task.done && "text-muted-foreground line-through"
                    )}
                  >
                    <span className="block truncate">{task.title}</span>
                    {task.related && (
                      <span className="text-muted-foreground block truncate text-xs no-underline">
                        {relatedLabel(data, task.related)}
                      </span>
                    )}
                  </button>
                  <Badge
                    variant={PRIORITY_VARIANT[task.priority]}
                    className="hidden sm:inline-flex"
                  >
                    {t(`priority.${task.priority}`)}
                  </Badge>
                  <span className="text-muted-foreground w-24 shrink-0 text-right text-xs tabular-nums">
                    {formatDate(task.dueDate)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <EntitySheet
        entity="task"
        collection="tasks"
        target={target}
        onClose={() => setTarget(null)}
        title={(task) => task?.title ?? `${t("common.new")}: ${t("nav.tasks").toLowerCase()}`}
      />
    </CrmPage>
  );
}
