import crmConfig from "@/crm.config";
import { activeAddons } from "./addon-registry";
import { contactName } from "./operations";
import type { CrmData, RelatedRef } from "./types";

/** Egy hivatkozott rekord olvasható neve (mag vagy bővítmény). */
export function relatedLabel(data: CrmData, ref: RelatedRef | null): string {
  if (!ref) return "";
  switch (ref.type) {
    case "contact": {
      const c = data.contacts.find((x) => x.id === ref.id);
      return c ? contactName(c, crmConfig.locale) : "";
    }
    case "company":
      return data.companies.find((x) => x.id === ref.id)?.name ?? "";
    case "deal":
      return data.deals.find((x) => x.id === ref.id)?.title ?? "";
  }
  for (const addon of activeAddons()) {
    const label = addon.relatedLabel?.(data.addons[addon.id], ref);
    if (label) return label;
  }
  return "";
}
