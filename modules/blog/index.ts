/*
 * Blog – tartalmi bővítmény Markdown-szerkesztővel (a közös tartalommotorra).
 * Bekapcsolás: crm.config.ts → addons: [..., "blog"]
 */
import { defineContentAddon } from "@/src/crm/content/define";
import { blogDef } from "./def";

export default defineContentAddon(blogDef);
