/*
 * Példa-preset: ingatlaniroda. Használat a gyökér crm.config.ts-ben:
 *   export { default } from "./presets/real-estate";
 *
 * Bekapcsolja az ingatlanos bővítményt (modules/real-estate): ingatlanok,
 * fotók, vevői keresési igények és automatikus párosítás. Az „Üzletek”
 * modul itt az ügyletek (adásvételi folyamat) követésére szolgál.
 */
import { defineCrmConfig } from "../src/crm/config";

export default defineCrmConfig({
  brand: { name: "Ingatlan CRM", accentColor: "oklch(0.55 0.15 160)" },
  locale: "hu",
  currency: "HUF",
  storageKey: "real-estate-crm",
  seedDemoData: true,
  addons: ["real-estate"],
  modules: { companies: false, deals: true, tasks: true },
  labels: { contacts: "Ügyfelek", deals: "Ügyletek" },
  pipeline: [
    { id: "inquiry", label: "Érdeklődés", probability: 10 },
    { id: "viewing", label: "Megtekintés", probability: 30 },
    { id: "offer", label: "Vételi ajánlat", probability: 60 },
    { id: "deposit", label: "Foglaló", probability: 85 },
    { id: "closed", label: "Adásvétel / bérleti szerződés", probability: 100, kind: "won" },
    { id: "failed", label: "Meghiúsult", probability: 0, kind: "lost" },
  ],
  contactTags: ["Eladó", "Vevő", "Bérlő", "Bérbeadó", "Befektető"],
  customFields: {
    contact: [
      {
        key: "source",
        label: "Forrás",
        type: "select",
        options: ["ingatlan.com", "Ajánlás", "Weboldal", "Tábla", "Egyéb"],
        showInList: true,
      },
    ],
    // A bővítmény entitásai is kaphatnak egyedi mezőt:
    property: [{ key: "energyCert", label: "Energetikai tanúsítvány", type: "text" }],
  },
});
