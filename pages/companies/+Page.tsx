import { PlusIcon } from "lucide-react";
import { useState } from "react";
import crmConfig from "@/crm.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActivityLog } from "@/components/crm/ActivityLog";
import { DataTable, type Column } from "@/components/crm/DataTable";
import { EntitySheet, type SheetTarget } from "@/components/crm/EntitySheet";
import { CrmPage, accentButton } from "@/components/crm/Page";
import { customColumns } from "@/components/crm/customColumns";
import { formatMoney, t } from "@/src/crm/i18n";
import { contactName, matchesQuery } from "@/src/crm/operations";
import { useCrm } from "@/src/crm/store";
import type { Company } from "@/src/crm/types";

export default function Page() {
  const { data } = useCrm();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<SheetTarget | null>(null);

  const rows = data.companies
    .filter((c) => matchesQuery(query, c.name, c.industry, c.email, c.address))
    .sort((a, b) => a.name.localeCompare(b.name, crmConfig.locale));

  const contactsOf = (id: string) => data.contacts.filter((c) => c.companyId === id);
  const dealsOf = (id: string) => data.deals.filter((d) => d.companyId === id);

  const columns: Column<Company>[] = [
    { key: "name", header: t("field.name"), cell: (c) => c.name },
    { key: "industry", header: t("field.industry"), cell: (c) => c.industry, hideOnMobile: true },
    { key: "phone", header: t("field.phone"), cell: (c) => c.phone, hideOnMobile: true },
    ...customColumns<Company>(crmConfig.customFields.company),
    { key: "contacts", header: t("nav.contacts"), cell: (c) => contactsOf(c.id).length },
    ...(crmConfig.modules.deals
      ? [{ key: "deals", header: t("nav.deals"), cell: (c: Company) => dealsOf(c.id).length }]
      : []),
  ];

  return (
    <CrmPage
      title={t("nav.companies")}
      enabled={crmConfig.modules.companies}
      actions={
        <Button className={accentButton} onClick={() => setTarget({ mode: "new" })}>
          <PlusIcon /> {t("common.new")}
        </Button>
      }
    >
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("common.search")}
        aria-label={t("common.search")}
        className="sm:max-w-xs"
      />
      <DataTable
        rows={rows}
        columns={columns}
        rowLabel={(c) => c.name}
        filtered={query !== ""}
        onOpen={(c) => setTarget({ mode: "edit", id: c.id })}
      />
      <EntitySheet
        entity="company"
        collection="companies"
        target={target}
        onClose={() => setTarget(null)}
        title={(c) => c?.name ?? `${t("common.new")}: ${t("nav.companies").toLowerCase()}`}
      >
        {(company) => (
          <>
            <RelatedList
              title={t("nav.contacts")}
              items={contactsOf(company.id).map((c) => ({
                id: c.id,
                label: contactName(c, crmConfig.locale),
                meta: c.jobTitle,
              }))}
            />
            {crmConfig.modules.deals && (
              <RelatedList
                title={t("nav.deals")}
                items={dealsOf(company.id).map((d) => ({
                  id: d.id,
                  label: d.title,
                  meta: formatMoney(d.value),
                }))}
              />
            )}
            <ActivityLog related={{ type: "company", id: company.id }} />
          </>
        )}
      </EntitySheet>
    </CrmPage>
  );
}

function RelatedList({
  title,
  items,
}: {
  title: string;
  items: { id: string; label: string; meta: string }[];
}) {
  return (
    <section className="flex flex-col gap-2 border-t pt-4">
      <h3 className="text-sm font-semibold">
        {title} <span className="text-muted-foreground font-normal">({items.length})</span>
      </h3>
      {items.length > 0 && (
        <ul className="flex flex-col divide-y text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-1.5">
              <span>{i.label}</span>
              <span className="text-muted-foreground">{i.meta}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
