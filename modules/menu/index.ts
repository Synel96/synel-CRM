/*
 * Étlap és itallap – vendéglátóhelyeknek (a „hospitality” profil része).
 * Bekapcsolás: crm.config.ts → industry: "hospitality", vagy addons: [..., "menu"]
 */
import { defineContentAddon } from "@/src/crm/content/define";
import { menuDef } from "./def";

export default defineContentAddon(menuDef);
