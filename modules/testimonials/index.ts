/*
 * Vélemények (ajánlások) – tartalmi bővítmény a közös tartalommotorra.
 * Bekapcsolás: crm.config.ts → addons: [..., "testimonials"]
 * Egy vélemény köthető egy kapcsolathoz és (ha be van kapcsolva) egy
 * szolgáltatáshoz; a kapcsolat adatlapján megjelennek a véleményei.
 */
import { defineContentAddon } from "@/src/crm/content/define";
import { TestimonialsContactPanel } from "./components/ContactPanel";
import { testimonialsDef } from "./def";

export default defineContentAddon({ ...testimonialsDef, ContactPanel: TestimonialsContactPanel });
