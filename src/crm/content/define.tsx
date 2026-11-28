/*
 * Egy tartalomtípus-leírásból (ContentTypeDef) teljes bővítményt készít:
 * menüpont a „Tartalomkezelés” csoportban, adatkezelés, mintaadatok,
 * áttekintő kártya, hivatkozások neve. A bővítmény oldala csak ennyi:
 *   export default () => <ContentListPage def={def} />;
 */
import type { CrmAddon } from "../addons";
import {
  contentCounts,
  emptyContent,
  normalizeContent,
  saveContentItem,
  type ContentData,
} from "./logic";
import type { ContentTypeDef } from "./types";
// FONTOS: a komponens importja maradjon a tiszta logika UTÁN. A komponens a
// store-on keresztül betölti a registry-t, az pedig a bővítményeket, amelyek
// ezt a fájlt hívják – addigra a fenti importoknak készen kell lenniük.
import { ContentDashboardCard } from "@/components/crm/content/ContentDashboardCard";

export function defineContentAddon(def: ContentTypeDef): CrmAddon {
  // Szándékosan nem a defineAddon()-t hívjuk: így ez a modul csak típusként
  // függ az addons.ts-től, és a registry ↔ store ↔ bővítmény import-körben
  // sem futhat le egy még be nem töltött függvény.
  const addon: CrmAddon<ContentData> = {
    id: def.addonId,
    name: def.labels().plural,
    group: "content",
    nav: () => [
      { id: def.addonId, href: `/${def.addonId}`, label: def.labels().plural, icon: def.icon },
    ],
    emptyData: emptyContent,
    normalize: normalizeContent,
    seed: def.seed
      ? (core) => {
          let data = emptyContent();
          const base = new Date();
          def.seed!(core).forEach((input, i) => {
            const at = new Date(base.getTime() - (10 - i) * 86_400_000);
            data = saveContentItem(data, input, null, { hasPage: def.hasPage }, at).data;
          });
          return data;
        }
      : undefined,
    onCoreRemove: def.onCoreRemove
      ? (data, collection, id) => ({ items: def.onCoreRemove!(data.items, collection, id) })
      : undefined,
    relatedLabel: (data, ref) =>
      ref.type === def.entity ? data.items.find((i) => i.id === ref.id)?.title : undefined,
    summary: (data) => [{ label: def.labels().plural, count: contentCounts(data).total }],
    DashboardWidget: () => <ContentDashboardCard def={def} />,
    ContactPanel: def.ContactPanel,
  };
  return addon as unknown as CrmAddon;
}
