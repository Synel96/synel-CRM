import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/src/crm/i18n";
import type { Id } from "@/src/crm/types";
import { rt } from "../i18n";
import { matchingProperties, stats } from "../logic";
import { useRealEstate } from "../useRealEstate";
import { formatPrice } from "../format";
import { StatusBadge } from "./PropertyCard";
import { PropertySheet, type PropertyTarget } from "./PropertySheet";
import { SearchSheet, type SearchTarget } from "./SearchSheet";

/** Áttekintés oldali KPI-sor. */
export function RealEstateDashboardWidget() {
  const { re } = useRealEstate();
  const s = stats(re);
  const kpis = [
    { label: rt("widget.active"), value: String(s.active), href: "/properties" },
    {
      label: rt("widget.portfolio"),
      value: formatMoney(s.portfolioSaleValue),
      href: "/properties",
    },
    { label: rt("widget.searches"), value: String(s.activeSearches), href: "/searches" },
    { label: rt("widget.matches"), value: String(s.matchPairs), href: "/searches" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((k) => (
        <a key={k.label} href={k.href} className="group">
          <Card className="gap-1 transition-colors group-hover:border-(--crm-accent)">
            <p className="text-muted-foreground text-xs">{k.label}</p>
            <p className="text-xl font-semibold tabular-nums">{k.value}</p>
          </Card>
        </a>
      ))}
    </div>
  );
}

/** Panel a kapcsolat szerkesztőjében: tulajdonában lévő ingatlanok + keresései. */
export function RealEstateContactPanel({ contactId }: { contactId: Id }) {
  const { re } = useRealEstate();
  const [propertyTarget, setPropertyTarget] = useState<PropertyTarget | null>(null);
  const [searchTarget, setSearchTarget] = useState<SearchTarget | null>(null);
  const owned = re.properties.filter((p) => p.ownerContactId === contactId);
  const searches = re.searches.filter((s) => s.contactId === contactId);

  return (
    <>
      <section className="flex flex-col gap-2 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {rt("panel.owned")}{" "}
            <span className="text-muted-foreground font-normal">({owned.length})</span>
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPropertyTarget({ mode: "new", ownerContactId: contactId })}
          >
            <PlusIcon /> {rt("panel.newProperty")}
          </Button>
        </div>
        {owned.length > 0 && (
          <ul className="divide-y text-sm">
            {owned.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setPropertyTarget({ mode: "edit", id: p.id })}
                  className="min-w-0 truncate text-left hover:underline"
                >
                  {p.title}
                </button>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="tabular-nums">{formatPrice(p)}</span>
                  <StatusBadge status={p.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {rt("panel.searches")}{" "}
            <span className="text-muted-foreground font-normal">({searches.length})</span>
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchTarget({ mode: "new", contactId })}
          >
            <PlusIcon /> {rt("panel.newSearch")}
          </Button>
        </div>
        {searches.length > 0 && (
          <ul className="divide-y text-sm">
            {searches.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setSearchTarget({ mode: "edit", id: s.id })}
                  className="min-w-0 truncate text-left hover:underline"
                >
                  {rt(`listing.${s.listingType}`)} · {s.cities.join(", ") || rt("list.anywhere")}
                </button>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {matchingProperties(re, s).length} {rt("match.count")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PropertySheet target={propertyTarget} onClose={() => setPropertyTarget(null)} />
      <SearchSheet target={searchTarget} onClose={() => setSearchTarget(null)} />
    </>
  );
}
