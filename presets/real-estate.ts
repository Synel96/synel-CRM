/*
 * Példa-preset: ingatlaniroda. Használat a gyökér crm.config.ts-ben:
 *   export { default } from "./presets/real-estate";
 */
import { defineCrmConfig } from "../src/crm/config";

export default defineCrmConfig({
  brand: { name: "Ingatlan CRM", accentColor: "oklch(0.55 0.15 160)" },
  locale: "hu",
  currency: "HUF",
  storageKey: "real-estate-crm",
  seedDemoData: true,
  modules: { companies: false, deals: true, tasks: true },
  labels: { contacts: "Ügyfelek", deals: "Ingatlanok" },
  pipeline: [
    { id: "intake", label: "Felvétel alatt", probability: 10 },
    { id: "active", label: "Aktív hirdetés", probability: 40 },
    { id: "viewing", label: "Megtekintések", probability: 60 },
    { id: "offer", label: "Ajánlat / foglaló", probability: 85 },
    { id: "sold", label: "Eladva", probability: 100, kind: "won" },
    { id: "withdrawn", label: "Visszavonva", probability: 0, kind: "lost" },
  ],
  contactTags: ["Eladó", "Vevő", "Bérlő", "Bérbeadó"],
  customFields: {
    contact: [
      { key: "budgetMax", label: "Max. költségkeret", type: "money" },
      { key: "searchArea", label: "Keresett környék", type: "text", showInList: true },
    ],
    company: [],
    deal: [
      {
        key: "listingType",
        label: "Típus",
        type: "select",
        options: ["Eladó", "Kiadó"],
        required: true,
        showInList: true,
      },
      {
        key: "propertyType",
        label: "Ingatlan típusa",
        type: "select",
        options: ["Lakás", "Ház", "Telek", "Iroda", "Üzlethelyiség"],
        showInList: true,
      },
      { key: "city", label: "Település", type: "text", required: true },
      { key: "areaSize", label: "Alapterület (m²)", type: "number" },
      { key: "roomCount", label: "Szobák száma", type: "number" },
      { key: "commissionPct", label: "Jutalék (%)", type: "number" },
      { key: "exclusive", label: "Kizárólagos megbízás", type: "boolean" },
    ],
    task: [],
  },
});
