/*
 * Szolgáltatások – tartalmi bővítmény (a közös tartalommotorra épül).
 * Bekapcsolás: crm.config.ts → addons: [..., "services"]
 */
import { BriefcaseBusinessIcon } from "lucide-react";
import crmConfig from "@/crm.config";
import { defineContentAddon } from "@/src/crm/content/define";
import type { ContentItem } from "@/src/crm/content/logic";
import type { ContentTypeDef } from "@/src/crm/content/types";
import { formatMoney } from "@/src/crm/i18n";

const hu = crmConfig.locale === "hu";
const L = hu
  ? {
      plural: "Szolgáltatások",
      singular: "szolgáltatás",
      title: "Név",
      short: "Rövid leírás",
      shortHint: "Listákban és kártyákon jelenik meg (1–2 mondat)",
      description: "Részletes leírás",
      priceFrom: "Ár (Ft)",
      priceNote: "Ár megjegyzés",
      priceNoteHint: "pl. „-tól”, „/hó”, „/óra” vagy „egyedi árajánlat”",
      price: "Ár",
    }
  : {
      plural: "Services",
      singular: "service",
      title: "Name",
      short: "Short description",
      shortHint: "Shown in lists and cards (1–2 sentences)",
      description: "Full description",
      priceFrom: "Price",
      priceNote: "Price note",
      priceNoteHint: "e.g. “from”, “/month”, “/hour” or “on request”",
      price: "Price",
    };

/** „350 000 Ft-tól”, „15 000 Ft/hó”, vagy csak a megjegyzés, ha nincs ár. */
export function formatServicePrice(item: ContentItem): string {
  const price = typeof item.priceFrom === "number" ? formatMoney(item.priceFrom) : "";
  const note = String(item.priceNote ?? "").trim();
  if (!price) return note;
  if (!note) return price;
  return /^[-/]/.test(note) ? `${price}${note}` : `${price} ${note}`;
}

export const servicesDef: ContentTypeDef = {
  addonId: "services",
  entity: "service",
  icon: BriefcaseBusinessIcon,
  labels: () => ({ plural: L.plural, singular: L.singular, title: L.title }),
  hasPage: true,
  maxImages: 1,
  fields: () => [
    {
      name: "shortDescription",
      label: L.short,
      type: "textarea",
      required: false,
      wide: true,
      hint: L.shortHint,
    },
    { name: "description", label: L.description, type: "textarea", required: false, wide: true },
    { name: "priceFrom", label: L.priceFrom, type: "money", required: false, nullable: true },
    { name: "priceNote", label: L.priceNote, type: "text", required: false, hint: L.priceNoteHint },
  ],
  columns: () => [
    {
      key: "price",
      header: L.price,
      hideOnMobile: true,
      cell: (i) => formatServicePrice(i) || "—",
    },
  ],
  preview: (i) => String(i.shortDescription ?? ""),
  seed: () =>
    hu
      ? [
          {
            title: "Weboldal-készítés",
            shortDescription: "Gyors, mobilbarát, keresőoptimalizált weboldal egyedi dizájnnal.",
            description: "Tervezéstől az élesítésig: dizájn, fejlesztés, SEO-alapok, tárhely.",
            priceFrom: 350_000,
            priceNote: "-tól",
            status: "published",
            featured: true,
          },
          {
            title: "Webshop",
            shortDescription: "Online bolt fizetéssel, számlázással és készletkezeléssel.",
            description: "",
            priceFrom: 600_000,
            priceNote: "-tól",
            status: "published",
          },
          {
            title: "CRM-bevezetés",
            shortDescription: "Ügyfélkezelés a cégedre szabva, a weboldaladdal összekötve.",
            description: "",
            priceFrom: 150_000,
            priceNote: "-tól",
            status: "published",
            featured: true,
          },
          {
            title: "Karbantartás és támogatás",
            shortDescription: "Frissítések, mentések, kisebb módosítások havidíjasan.",
            description: "",
            priceFrom: 15_000,
            priceNote: "/hó",
            status: "draft",
          },
        ]
      : [
          {
            title: "Website design",
            shortDescription: "Fast, mobile-friendly, SEO-ready websites.",
            priceFrom: 350_000,
            priceNote: "from",
            status: "published",
          },
        ],
};

export default defineContentAddon(servicesDef);
