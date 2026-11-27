/*
 * Ingatlanos bővítmény.
 * Bekapcsolás a crm.config.ts-ben: `addons: ["real-estate"]`
 * Részletek: modules/real-estate/README.md
 */
import { HouseIcon, SearchCheckIcon } from "lucide-react";
import { defineAddon } from "@/src/crm/addons";
import { RealEstateContactPanel, RealEstateDashboardWidget } from "./components/Widgets";
import { rt } from "./i18n";
import { emptyRealEstate, normalizeRealEstate, onCoreRemove, shortAddress } from "./logic";
import { seedRealEstate } from "./seed";
import { ADDON_ID, type RealEstateData } from "./types";

export default defineAddon<RealEstateData>({
  id: ADDON_ID,
  name: "Ingatlan",
  nav: () => [
    { id: "properties", href: "/properties", label: rt("nav.properties"), icon: HouseIcon },
    { id: "searches", href: "/searches", label: rt("nav.searches"), icon: SearchCheckIcon },
  ],
  emptyData: emptyRealEstate,
  normalize: normalizeRealEstate,
  seed: (core) => seedRealEstate(core),
  onCoreRemove,
  relatedLabel: (data, ref) => {
    if (ref.type !== "property") return undefined;
    const p = data.properties.find((x) => x.id === ref.id);
    return p ? `${p.title} (${shortAddress(p, false)})` : undefined;
  },
  summary: (data) => [
    { label: rt("nav.properties"), count: data.properties.length },
    { label: rt("nav.searches"), count: data.searches.length },
  ],
  DashboardWidget: RealEstateDashboardWidget,
  ContactPanel: RealEstateContactPanel,
});
