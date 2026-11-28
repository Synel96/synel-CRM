/*
 * Szezonális ajánlatok – vendéglátóhelyeknek (a „hospitality” profil része).
 * Bekapcsolás: crm.config.ts → industry: "hospitality", vagy addons: [..., "offers"]
 */
import { defineContentAddon } from "@/src/crm/content/define";
import { offersDef } from "./def";

export default defineContentAddon(offersDef);
