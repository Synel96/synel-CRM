import { useCrm } from "@/src/crm/store";
import type { CrmData } from "@/src/crm/types";
import { emptyRealEstate } from "./logic";
import { ADDON_ID, type RealEstateData } from "./types";

type Updater = (data: RealEstateData, core: CrmData) => RealEstateData | [RealEstateData, CrmData];

/** A bővítmény adatai + módosító függvény (a CRM store-ra épül). */
export function useRealEstate() {
  const crm = useCrm();
  const re = (crm.data.addons[ADDON_ID] as RealEstateData | undefined) ?? emptyRealEstate();
  const update = (fn: Updater) => crm.store.updateAddon<RealEstateData>(ADDON_ID, fn);
  return { ...crm, re, update };
}
