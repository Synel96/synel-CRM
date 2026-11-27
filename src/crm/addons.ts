/*
 * Bővítmény (addon) interfész. Egy bővítmény egy önálló mappa a modules/
 * alatt, ami ezt az objektumot exportálja. Bekapcsolás:
 *   1. src/crm/addon-registry.ts – felvenni az elérhetők közé (egyszer)
 *   2. crm.config.ts – `addons: ["<id>"]`
 * A bővítmény oldalai (`+Page.tsx` + `+route.ts`) a saját mappájában élnek.
 */
import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { CrmConfig } from "./config";
import type { Collection, CrmData, Id, RelatedRef } from "./types";

export type AddonNavItem = {
  href: string;
  /** Menüpont azonosító – a config `labels` mezőjével átnevezhető. */
  id: string;
  label: string;
  icon: LucideIcon;
};

export interface CrmAddon<D = unknown> {
  id: string;
  name: string;
  /** Menüpontok (a Beállítások elé kerülnek). */
  nav: () => AddonNavItem[];

  /** Üres kezdőállapot. */
  emptyData: () => D;
  /** Betöltött/importált adat normalizálása (hiányzó mezők pótlása). */
  normalize?: (raw: unknown) => D;
  /** Mintaadatok – a mag mintaadataira (pl. kapcsolatokra) hivatkozhat. */
  seed?: (core: CrmData, config: CrmConfig) => D;

  /** Mag-rekord törlésekor (pl. kapcsolat) a bővítmény adatainak takarítása. */
  onCoreRemove?: (data: D, collection: Collection, id: Id) => D;
  /** Tevékenységek/feladatok hivatkozásának olvasható neve (pl. ingatlan címe). */
  relatedLabel?: (data: D, ref: RelatedRef) => string | undefined;
  /** Rövid összesítő a Beállítások oldalra (pl. „12 ingatlan”). */
  summary?: (data: D) => { label: string; count: number }[];

  /** Widget az Áttekintés oldalra. */
  DashboardWidget?: ComponentType;
  /** Panel a kapcsolat szerkesztőjében (pl. a kapcsolat ingatlanai). */
  ContactPanel?: ComponentType<{ contactId: Id }>;
}

/**
 * Típushelyes bővítmény-definíció. A belső adattípus (D) a definíción belül
 * ellenőrzött; kifelé általános CrmAddon-ként kezeljük (a registry így
 * különböző bővítményeket tarthat egy listában).
 */
export function defineAddon<D>(addon: CrmAddon<D>): CrmAddon {
  return addon as unknown as CrmAddon;
}
