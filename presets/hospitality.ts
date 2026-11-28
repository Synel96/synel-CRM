/*
 * Példa: vendéglátóhely-ügyfél configja („hospitality” profil: étlap,
 * szezonális ajánlatok, galéria, vélemények, rendezvények).
 * Használat a gyökér crm.config.ts-ben:
 *   export { default } from "./presets/hospitality";
 */
import { defineCrmConfig } from "../src/crm/config";

export default defineCrmConfig({
  industry: "hospitality",
  brand: { name: "Bisztró 52", accentColor: "oklch(0.55 0.16 35)", showLogo: false },
  storageKey: "bisztro52-crm",
  media: { folder: "bisztro52" },
  // Az étlap szekciói ügyfelenként átírhatók:
  addonSettings: {
    menu: { sections: ["Előételek", "Levesek", "Főételek", "Desszertek", "Italok"] },
  },
});
