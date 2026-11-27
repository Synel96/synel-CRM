import { MailIcon, MessageSquareIcon, PhoneIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { formatDateTime, t } from "@/src/crm/i18n";
import { useCrm } from "@/src/crm/store";
import type { ActivityKind, RelatedRef } from "@/src/crm/types";

const ICONS = { note: MessageSquareIcon, call: PhoneIcon, email: MailIcon, meeting: UsersIcon };
const KINDS: ActivityKind[] = ["note", "call", "email", "meeting"];

export function ActivityLog({ related }: { related: RelatedRef }) {
  const { data, store } = useCrm();
  const [kind, setKind] = useState<ActivityKind>("note");
  const [body, setBody] = useState("");
  const items = data.activities
    .filter((a) => a.related.type === related.type && a.related.id === related.id)
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section className="flex flex-col gap-3 border-t pt-4">
      <h3 className="text-sm font-semibold">{t("activity.title")}</h3>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          store.create("activities", {
            kind,
            body: body.trim(),
            at: new Date().toISOString(),
            related,
          });
          setBody("");
        }}
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("activity.placeholder")}
          className="min-h-16"
          aria-label={t("activity.placeholder")}
        />
        <div className="flex gap-2">
          <NativeSelect
            value={kind}
            onChange={(e) => setKind(e.target.value as ActivityKind)}
            className="w-auto"
            aria-label={t("activity.title")}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`activity.${k}`)}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" variant="outline" disabled={!body.trim()}>
            {t("activity.add")}
          </Button>
        </div>
      </form>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("common.empty")}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((a) => {
            const Icon = ICONS[a.kind];
            return (
              <li key={a.id} className="flex gap-3">
                <span className="bg-muted mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs">
                    {t(`activity.${a.kind}`)} · {formatDateTime(a.at)}
                  </p>
                  <p className="text-sm break-words whitespace-pre-wrap">{a.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => store.remove("activities", a.id)}
                  className="text-muted-foreground hover:text-destructive self-start text-xs"
                >
                  {t("common.delete")}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
