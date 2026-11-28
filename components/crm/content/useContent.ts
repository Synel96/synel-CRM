import { emptyContent, type ContentData } from "@/src/crm/content/logic";
import type { ContentTypeDef } from "@/src/crm/content/types";
import { useCrm } from "@/src/crm/store";
import type { CrmData } from "@/src/crm/types";

type Updater = (data: ContentData, core: CrmData) => ContentData | [ContentData, CrmData];

/** Egy tartalomtípus adatai + módosító függvény. */
export function useContent(def: ContentTypeDef) {
  const crm = useCrm();
  const content = (crm.data.addons[def.addonId] as ContentData | undefined) ?? emptyContent();
  const update = (fn: Updater) => crm.store.updateAddon<ContentData>(def.addonId, fn);
  return { ...crm, content, update };
}
