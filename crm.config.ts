/*
 * ─── ÜGYFÉL-KONFIGURÁCIÓ ─────────────────────────────────────────────────
 * 1. Válaszd ki az üzlettípust (`industry`) – ez adja a modulokat,
 *    bővítményeket, menüneveket, pipeline-t, címkéket és egyedi mezőket:
 *      "general"      – általános CRM
 *      "agency"       – webstúdió / ügynökség (szolgáltatások, projektek, blog…)
 *      "real-estate"  – ingatlaniroda (ingatlanok, keresési igények…)
 *      "hospitality"  – vendéglátóhely (étlap, szezonális ajánlatok…)
 * 2. Írd át, ami az ügyfélnél más (minden kulcs felülírja a profilét).
 * A profilok: src/crm/industries.ts · a séma: src/crm/config.ts
 * Kész példák: presets/ (pl. `export { default } from "./presets/hospitality";`)
 */
import { defineCrmConfig } from "./src/crm/config";

export default defineCrmConfig({
  industry: "agency",

  brand: {
    name: "Synelweb CRM",
    accentColor: "#2B5FD9",
  },
  locale: "hu",
  currency: "HUF",
  storageKey: "synel-crm",
  seedDemoData: true,

  // Képek Cloudinary-mappája (a hozzáférés a .env-ben: VITE_CLOUDINARY_*)
  media: { folder: "synelweb" },

  // Példák felülírásra (a profil értékei helyett):
  // addons: ["services", "projects", "testimonials", "blog", "gallery", "real-estate"],
  // labels: { deals: "Projektek", "group.content": "Weboldal" },
  // modules: { companies: false },
});
