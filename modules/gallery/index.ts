/*
 * Galéria – albumok képekkel (alt szöveggel), a közös tartalommotorra.
 * Bekapcsolás: crm.config.ts → addons: [..., "gallery"]
 */
import { defineContentAddon } from "@/src/crm/content/define";
import { galleryDef } from "./def";

export default defineContentAddon(galleryDef);
