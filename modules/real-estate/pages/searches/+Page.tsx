import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import crmConfig from "@/crm.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/crm/DataTable";
import { CrmPage, accentButton } from "@/components/crm/Page";
import { isAddonActive } from "@/src/crm/addon-registry";
import { formatMoney, navLabel, t } from "@/src/crm/i18n";
import { contactName, matchesQuery } from "@/src/crm/operations";
import { SearchSheet, type SearchTarget } from "../../components/SearchSheet";
import { rt, type ReKey } from "../../i18n";
import { matchingProperties } from "../../logic";
import { ADDON_ID, type BuyerSearch } from "../../types";
import { useRealEstate } from "../../useRealEstate";

function priceRange(s: BuyerSearch) {
  if (s.priceMin === null && s.priceMax === null) return t("common.none");
  if (s.priceMin === null) return `≤ ${formatMoney(s.priceMax!)}`;
  if (s.priceMax === null) return `≥ ${formatMoney(s.priceMin)}`;
  return `${formatMoney(s.priceMin)} – ${formatMoney(s.priceMax)}`;
}

export default function Page() {
  const { data, re } = useRealEstate();
  const { urlParsed } = usePageContext();
  const [target, setTarget] = useState<SearchTarget | null>(() =>
    urlParsed.search.id ? { mode: "edit", id: urlParsed.search.id } : null
  );
  const [query, setQuery] = useState("");

  const name = (s: BuyerSearch) => {
    const c = data.contacts.find((x) => x.id === s.contactId);
    return c ? contactName(c, crmConfig.locale) : t("common.none");
  };

  const rows = re.searches
    .filter((s) => matchesQuery(query, name(s), ...s.cities))
    .sort((a, b) => Number(b.active) - Number(a.active) || name(a).localeCompare(name(b)));

  const columns: Column<BuyerSearch>[] = [
    { key: "contact", header: rt("f.contact"), cell: name },
    { key: "listing", header: rt("f.listingType"), cell: (s) => rt(`listing.${s.listingType}`) },
    {
      key: "types",
      header: rt("f.propertyTypes"),
      hideOnMobile: true,
      cell: (s) =>
        s.propertyTypes.length
          ? s.propertyTypes.map((x) => rt(`type.${x}` as ReKey)).join(", ")
          : rt("list.anyType"),
    },
    {
      key: "cities",
      header: rt("f.cities"),
      hideOnMobile: true,
      cell: (s) => (s.cities.length ? s.cities.join(", ") : rt("list.anywhere")),
    },
    { key: "price", header: rt("f.price"), hideOnMobile: true, cell: priceRange },
    {
      key: "matches",
      header: rt("widget.matches"),
      cell: (s) => {
        const n = matchingProperties(re, s).length;
        return s.active ? (
          <Badge variant={n > 0 ? "success" : "outline"}>{n}</Badge>
        ) : (
          <Badge variant="outline">{t("common.no")}</Badge>
        );
      },
    },
  ];

  return (
    <CrmPage
      title={navLabel("searches", rt("nav.searches"))}
      enabled={isAddonActive(ADDON_ID)}
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
        rowLabel={name}
        filtered={query !== ""}
        onOpen={(s) => setTarget({ mode: "edit", id: s.id })}
      />
      <SearchSheet target={target} onClose={() => setTarget(null)} />
    </CrmPage>
  );
}
