import { formatMoney } from "@/src/crm/i18n";
import { rt } from "./i18n";
import type { Property } from "./types";

/** Ár megjelenítése; kiadónál „/hó” utótaggal. */
export function formatPrice(p: Pick<Property, "price" | "listingType">) {
  return formatMoney(p.price) + (p.listingType === "rent" ? rt("list.perMonth") : "");
}
