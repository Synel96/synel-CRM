/*
 * ─── ÜGYFÉL-KONFIGURÁCIÓ ─────────────────────────────────────────────────
 * Új ügyfélnél ezt a fájlt szabd személyre (vagy exportálj egy presetet a
 * presets/ mappából: `export { default } from "./presets/real-estate";`).
 * A séma és a mezők leírása: src/crm/config.ts
 */
import { defineCrmConfig } from "./src/crm/config";

export default defineCrmConfig({
  brand: {
    name: "Synel CRM",
    accentColor: "oklch(0.55 0.2 260)",
  },
  locale: "hu",
  currency: "HUF",
  storageKey: "synel-crm",
  seedDemoData: true,

  modules: { companies: true, deals: true, tasks: true },

  // Modulnevek felülírása, pl. { deals: "Projektek" }
  labels: {},

  pipeline: [
    { id: "lead", label: "Új érdeklődő", probability: 10 },
    { id: "qualified", label: "Minősített", probability: 30 },
    { id: "proposal", label: "Ajánlat kiküldve", probability: 60 },
    { id: "negotiation", label: "Tárgyalás", probability: 80 },
    { id: "won", label: "Megnyert", probability: 100, kind: "won" },
    { id: "lost", label: "Elvesztett", probability: 0, kind: "lost" },
  ],

  contactTags: ["Partner", "VIP", "Hideg lead"],

  customFields: {
    contact: [
      {
        key: "source",
        label: "Forrás",
        type: "select",
        options: ["Weboldal", "Ajánlás", "Hirdetés", "Rendezvény"],
        showInList: true,
      },
      { key: "newsletter", label: "Hírlevélre feliratkozott", type: "boolean" },
    ],
    company: [{ key: "taxNumber", label: "Adószám", type: "text" }],
    deal: [],
    task: [],
  },
});
