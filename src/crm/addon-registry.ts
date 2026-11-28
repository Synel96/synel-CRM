/*
 * Az elérhető bővítmények listája. Új bővítmény: importáld és vedd fel az
 * AVAILABLE tömbbe, majd kapcsold be a crm.config.ts `addons` listájában.
 * Nem használt bővítmény törlésekor a mappáját és az itteni sort kell
 * eltávolítani.
 */
import crmConfig from "@/crm.config";
import realEstate from "@/modules/real-estate";
import services from "@/modules/services";
import projects from "@/modules/projects";
import testimonials from "@/modules/testimonials";
import blog from "@/modules/blog";
import gallery from "@/modules/gallery";
import menu from "@/modules/menu";
import offers from "@/modules/offers";
import type { CrmAddon } from "./addons";

// Függvényben, nem modulszinten: így a körkörös importok (bővítmény →
// store → registry) nem okoznak gondot, a lista csak első használatkor épül.
function available(): CrmAddon[] {
  // A sorrend számít: a mintaadatokban a projektek a szolgáltatásokra, az
  // ajánlatok az étlapra, a vélemények a szolgáltatásokra és projektekre
  // hivatkoznak; a menüben is ebben a sorrendben jelennek meg.
  return [realEstate, services, projects, menu, offers, testimonials, blog, gallery];
}

let active: CrmAddon[] | null = null;

export function activeAddons(): CrmAddon[] {
  if (!active) {
    const all = available();
    const unknown = crmConfig.addons.filter((id) => !all.some((a) => a.id === id));
    if (unknown.length) {
      throw new Error(
        `Ismeretlen bővítmény a crm.config-ban: ${unknown.join(", ")}. ` +
          `Elérhető: ${all.map((a) => a.id).join(", ")}`
      );
    }
    active = all.filter((a) => crmConfig.addons.includes(a.id));
  }
  return active;
}

export function isAddonActive(id: string): boolean {
  return activeAddons().some((a) => a.id === id);
}
