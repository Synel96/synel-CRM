import { useEffect, type ReactNode } from "react";
import crmConfig from "@/crm.config";
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

export const accentButton = "bg-(--crm-accent) text-white hover:bg-(--crm-accent)/85";
