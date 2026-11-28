/*
 * Projektek (referenciák) – tartalmi bővítmény a közös tartalommotorra.
 * Bekapcsolás: crm.config.ts → addons: [..., "projects"]
 */
import { defineContentAddon } from "@/src/crm/content/define";
import { ProjectsContactPanel, ProjectTestimonials } from "./components/ProjectPanels";
import { projectsDef } from "./def";

export default defineContentAddon({
  ...projectsDef,
  Extra: ProjectTestimonials,
  ContactPanel: ProjectsContactPanel,
});
