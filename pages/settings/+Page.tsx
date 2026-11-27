import { DownloadIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import crmConfig from "@/crm.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CrmPage } from "@/components/crm/Page";
import { activeAddons } from "@/src/crm/addon-registry";
import { t, type MessageKey } from "@/src/crm/i18n";
import { parseCrmData } from "@/src/crm/storage";
import { useCrm } from "@/src/crm/store";

const ENTITY_LABEL: Record<string, MessageKey> = {
  contact: "nav.contacts",
  company: "nav.companies",
  deal: "nav.deals",
  task: "nav.tasks",
};

export default function Page() {
  const { data, store } = useCrm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const c = crmConfig;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.storageKey}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const parsed = parseCrmData(await file.text());
      if (!window.confirm(t("settings.confirmReplace"))) return;
      store.replaceAll(parsed);
      setMessage({ ok: true, text: t("settings.importOk") });
    } catch (err) {
      setMessage({ ok: false, text: `${t("settings.importError")} ${(err as Error).message}` });
    }
  };

  const row = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[9rem_1fr] gap-3 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{value}</dd>
    </div>
  );

  return (
    <CrmPage title={t("nav.settings")}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>{t("settings.config")}</CardTitle>
          <p className="text-muted-foreground text-xs">{t("settings.configHint")}</p>
          <dl className="divide-y">
            {row(t("settings.brand"), c.brand.name)}
            {row(t("settings.locale"), c.locale)}
            {row(t("settings.currency"), c.currency)}
            {row(
              t("settings.modules"),
              <span className="flex flex-wrap gap-1">
                {(Object.keys(c.modules) as (keyof typeof c.modules)[]).map((m) => (
                  <Badge key={m} variant={c.modules[m] ? "success" : "outline"}>
                    {t(`nav.${m}`)}
                  </Badge>
                ))}
              </span>
            )}
            {row(
              t("settings.pipeline"),
              <ol className="flex flex-col gap-0.5">
                {c.pipeline.map((s) => (
                  <li key={s.id}>
                    {s.label} <span className="text-muted-foreground">· {s.probability}%</span>
                    {s.kind !== "open" && (
                      <Badge variant={s.kind === "won" ? "success" : "outline"} className="ml-1">
                        {s.kind}
                      </Badge>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {row(
              t("settings.customFields"),
              <ul className="flex flex-col gap-0.5">
                {Object.entries(c.customFields).flatMap(([e, fields]) =>
                  fields.map((f) => (
                    <li key={`${e}.${f.key}`}>
                      {f.label}{" "}
                      <span className="text-muted-foreground">
                        · {ENTITY_LABEL[e] ? t(ENTITY_LABEL[e]) : e} · {f.type}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            )}
            {row(
              t("settings.addons"),
              activeAddons().length === 0 ? (
                t("common.none")
              ) : (
                <span className="flex flex-wrap gap-1">
                  {activeAddons().map((a) => (
                    <Badge key={a.id} variant="accent">
                      {a.name}
                    </Badge>
                  ))}
                </span>
              )
            )}
          </dl>
        </Card>

        <Card>
          <CardTitle>{t("settings.data")}</CardTitle>
          <p className="text-muted-foreground text-xs">{t("settings.dataHint")}</p>
          <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {(["contacts", "companies", "deals", "tasks", "activities"] as const).map((k) => (
              <li key={k} className="bg-muted/50 rounded-lg px-3 py-2">
                <span className="block text-lg font-semibold tabular-nums">{data[k].length}</span>
                <span className="text-muted-foreground text-xs">
                  {k === "activities" ? t("activity.title") : t(`nav.${k}`)}
                </span>
              </li>
            ))}
            {activeAddons().flatMap((a) =>
              (a.summary?.(data.addons[a.id]) ?? []).map((s) => (
                <li key={`${a.id}.${s.label}`} className="bg-muted/50 rounded-lg px-3 py-2">
                  <span className="block text-lg font-semibold tabular-nums">{s.count}</span>
                  <span className="text-muted-foreground text-xs">{s.label}</span>
                </li>
              ))
            )}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportJson}>
              <DownloadIcon /> {t("settings.export")}
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <UploadIcon /> {t("settings.import")}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importJson(file);
                e.target.value = "";
              }}
            />
          </div>
          {message && (
            <p
              role="status"
              className={message.ok ? "text-sm text-emerald-600" : "text-destructive text-sm"}
            >
              {message.text}
            </p>
          )}
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button
              variant="outline"
              onClick={() => window.confirm(t("settings.confirmReplace")) && store.resetToDemo()}
            >
              {t("settings.resetDemo")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => window.confirm(t("common.confirmDelete")) && store.clearAll()}
            >
              {t("settings.clearAll")}
            </Button>
          </div>
        </Card>
      </div>
    </CrmPage>
  );
}
