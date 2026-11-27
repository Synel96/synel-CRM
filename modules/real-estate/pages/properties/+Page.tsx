import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { CrmPage, EmptyState, accentButton } from "@/components/crm/Page";
import { isAddonActive } from "@/src/crm/addon-registry";
import { navLabel, t } from "@/src/crm/i18n";
import { matchesQuery } from "@/src/crm/operations";
import { PropertyCard } from "../../components/PropertyCard";
import { PropertySheet, type PropertyTarget } from "../../components/PropertySheet";
import { rt, type ReKey } from "../../i18n";
import { matchingSearches } from "../../logic";
import { ADDON_ID, LISTING_TYPES, PROPERTY_STATUSES, PROPERTY_TYPES } from "../../types";
import { useRealEstate } from "../../useRealEstate";

function Filter({
  label,
  value,
  onChange,
  values,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  values: readonly string[];
  prefix: string;
}) {
  return (
    <NativeSelect
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="sm:w-auto"
    >
      <option value="">
        {label}: {rt("list.all")}
      </option>
      {values.map((v) => (
        <option key={v} value={v}>
          {rt(`${prefix}.${v}` as ReKey)}
        </option>
      ))}
    </NativeSelect>
  );
}

export default function Page() {
  const { re } = useRealEstate();
  const { urlParsed } = usePageContext();
  const [target, setTarget] = useState<PropertyTarget | null>(() =>
    urlParsed.search.id ? { mode: "edit", id: urlParsed.search.id } : null
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [listing, setListing] = useState("");
  const [type, setType] = useState("");

  const rows = re.properties
    .filter((p) => !status || p.status === status)
    .filter((p) => !listing || p.listingType === listing)
    .filter((p) => !type || p.propertyType === type)
    .filter((p) => matchesQuery(query, p.title, p.ownId, p.city, p.district, p.street))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const filtered = Boolean(query || status || listing || type);

  return (
    <CrmPage
      title={navLabel("properties", rt("nav.properties"))}
      enabled={isAddonActive(ADDON_ID)}
      actions={
        <Button className={accentButton} onClick={() => setTarget({ mode: "new" })}>
          <PlusIcon /> {t("common.new")}
        </Button>
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={rt("list.searchPlaceholder")}
          aria-label={t("common.search")}
          className="sm:max-w-xs"
        />
        <Filter
          label={rt("f.status")}
          value={status}
          onChange={setStatus}
          values={PROPERTY_STATUSES}
          prefix="status"
        />
        <Filter
          label={rt("f.listingType")}
          value={listing}
          onChange={setListing}
          values={LISTING_TYPES}
          prefix="listing"
        />
        <Filter
          label={rt("f.propertyType")}
          value={type}
          onChange={setType}
          values={PROPERTY_TYPES}
          prefix="type"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState>{filtered ? t("common.noResults") : t("common.empty")}</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              matchCount={matchingSearches(re, p).length}
              onOpen={() => setTarget({ mode: "edit", id: p.id })}
            />
          ))}
        </ul>
      )}

      <PropertySheet target={target} onClose={() => setTarget(null)} />
    </CrmPage>
  );
}
