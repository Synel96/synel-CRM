/*
 * Példa: ingatlaniroda-ügyfél configja. A modulokat, bővítményeket,
 * menüneveket, pipeline-t és mezőket az „real-estate” üzlettípus-profil adja
 * (src/crm/industries.ts) – itt csak az ügyfélre jellemző értékek vannak.
 * Használat a gyökér crm.config.ts-ben:
 *   export { default } from "./presets/real-estate";
 */
import { defineCrmConfig } from "../src/crm/config";

export default defineCrmConfig({
  industry: "real-estate",
  brand: { name: "Ingatlan CRM", accentColor: "oklch(0.55 0.15 160)", showLogo: false },
  storageKey: "real-estate-crm",
  media: { folder: "real-estate-crm" },
});
