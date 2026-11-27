import type { CrmAddon } from "./addons";
import type { CrmConfig } from "./config";
import type { Collection, CrmData, Id } from "./types";

/**
 * Minden aktív bővítménynek legyen (normalizált) adata. Ha hiányzik:
 * mintaadatos indulásnál a bővítmény seed-je, egyébként üres állapot.
 */
export function ensureAddonData(
  data: CrmData,
  addons: CrmAddon[],
  config: CrmConfig,
  { seed }: { seed: boolean }
): CrmData {
  const next = { ...data.addons };
  for (const a of addons) {
    const raw = next[a.id];
    if (raw === undefined) {
      next[a.id] = seed && a.seed ? a.seed(data, config) : a.emptyData();
    } else if (a.normalize) {
      next[a.id] = a.normalize(raw);
    }
  }
  return { ...data, addons: next };
}

/** Mag-rekord törlése után a bővítmények saját takarítása. */
export function applyCoreRemove(
  data: CrmData,
  addons: CrmAddon[],
  collection: Collection,
  id: Id
): CrmData {
  const next = { ...data.addons };
  for (const a of addons) {
    if (a.onCoreRemove && next[a.id] !== undefined) {
      next[a.id] = a.onCoreRemove(next[a.id], collection, id);
    }
  }
  return { ...data, addons: next };
}
