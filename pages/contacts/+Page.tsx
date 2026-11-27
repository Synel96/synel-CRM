import { PlusIcon } from "lucide-react";
import { useState } from "react";
import crmConfig from "@/crm.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { ActivityLog } from "@/components/crm/ActivityLog";
import { DataTable, type Column } from "@/components/crm/DataTable";
import { EntitySheet, type SheetTarget } from "@/components/crm/EntitySheet";
import { CrmPage, accentButton } from "@/components/crm/Page";
import { customColumns } from "@/components/crm/customColumns";
import { t } from "@/src/crm/i18n";
import { contactName, matchesQuery } from "@/src/crm/operations";
import { useCrm } from "@/src/crm/store";
import type { Contact } from "@/src/crm/types";

export default function Page() {
  const { data } = useCrm();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [target, setTarget] = useState<SheetTarget | null>(null);
  const companyName = (id: string | null) => data.companies.find((c) => c.id === id)?.name ?? "";
  const name = (c: Contact) => contactName(c, crmConfig.locale);

  const rows = data.contacts
    .filter((c) => (tag ? c.tags.includes(tag) : true))
    .filter((c) => matchesQuery(query, name(c), c.email, c.phone, companyName(c.companyId)))
    .sort((a, b) => name(a).localeCompare(name(b), crmConfig.locale));

  const columns: Column<Contact>[] = [
    { key: "name", header: t("field.name"), cell: name },
    ...(crmConfig.modules.companies
      ? [
          {
            key: "company",
            header: t("field.company"),
            cell: (c: Contact) => companyName(c.companyId),
          },
        ]
      : []),
    { key: "email", header: t("field.email"), cell: (c) => c.email, hideOnMobile: true },
    { key: "phone", header: t("field.phone"), cell: (c) => c.phone, hideOnMobile: true },
    ...customColumns<Contact>(crmConfig.customFields.contact),
    {
      key: "tags",
      header: t("field.tags"),
      hideOnMobile: true,
      cell: (c) => (
        <span className="flex flex-wrap gap-1">
          {c.tags.map((x) => (
            <Badge key={x} variant="accent">
              {x}
            </Badge>
          ))}
        </span>
      ),
    },
  ];

  return (
    <CrmPage
      title={t("nav.contacts")}
      actions={
        <Button className={accentButton} onClick={() => setTarget({ mode: "new" })}>
          <PlusIcon /> {t("common.new")}
        </Button>
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.search")}
          aria-label={t("common.search")}
          className="sm:max-w-xs"
        />
        {crmConfig.contactTags.length > 0 && (
          <NativeSelect
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            aria-label={t("field.tags")}
            className="sm:w-48"
          >
            <option value="">{t("field.tags")}: —</option>
            {crmConfig.contactTags.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </NativeSelect>
        )}
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        rowLabel={name}
        filtered={query !== "" || tag !== ""}
        onOpen={(c) => setTarget({ mode: "edit", id: c.id })}
      />

      <EntitySheet
        entity="contact"
        collection="contacts"
        target={target}
        onClose={() => setTarget(null)}
        title={(c) => (c ? name(c) : `${t("common.new")}: ${t("nav.contacts").toLowerCase()}`)}
      >
        {(c) => <ActivityLog related={{ type: "contact", id: c.id }} />}
      </EntitySheet>
    </CrmPage>
  );
}
