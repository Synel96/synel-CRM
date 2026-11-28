/*
 * Étlap és itallap – vendéglátóhelyeknek (a közös tartalommotorra).
 * Szekciók (configból átírhatók), ár, kiszerelés, alkoholtartalom, a 14
 * uniós allergén, étrendi jelölések, „elfogyott” kapcsoló, kép alt szöveggel.
 *
 * Beállítás: crm.config.ts → addonSettings: { menu: { sections: [...] } }
 * A weboldalon az a tétel jelenjen meg, ami publikált ÉS elérhető (isOnMenu).
 */
import { UtensilsCrossedIcon } from "lucide-react";
import crmConfig from "@/crm.config";
import { Badge } from "@/components/ui/badge";
import type { ContentItem } from "@/src/crm/content/logic";
import type { ContentTypeDef } from "@/src/crm/content/types";
import { formatMoney } from "@/src/crm/i18n";

export const DEFAULT_SECTIONS = ["Előételek", "Levesek", "Főételek", "Desszertek", "Italok"];

/** A 14 kötelezően jelölendő allergén (1169/2011/EU rendelet, II. melléklet). */
export const ALLERGENS = [
  "Glutén",
  "Rákfélék",
  "Tojás",
  "Hal",
  "Földimogyoró",
  "Szója",
  "Tej (laktóz)",
  "Diófélék",
  "Zeller",
  "Mustár",
  "Szezámmag",
  "Kén-dioxid, szulfitok",
  "Csillagfürt",
  "Puhatestűek",
] as const;

export const DIETS = ["Vegán", "Vegetáriánus", "Gluténmentes", "Laktózmentes", "Csípős"] as const;

/** Az étlap szekciói: a config `addonSettings.menu.sections`, különben az alapértelmezés. */
export function menuSections(): string[] {
  const s = crmConfig.addonSettings.menu?.sections;
  return Array.isArray(s) && s.every((x) => typeof x === "string") && s.length
    ? (s as string[])
    : DEFAULT_SECTIONS;
}

const list = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
export const allergensOf = (i: ContentItem) => list(i.allergens);
export const dietsOf = (i: ContentItem) => list(i.diets);
export const isAvailable = (i: ContentItem) => i.available !== false;
/** A weboldal étlapján megjelenik-e: publikált és nem fogyott el. */
export const isOnMenu = (i: ContentItem) => i.status === "published" && isAvailable(i);

/** „2 490 Ft · 0,5 l” */
export function menuPrice(i: ContentItem): string {
  const price = typeof i.price === "number" ? formatMoney(i.price) : "";
  return [price, String(i.volume ?? "").trim()].filter(Boolean).join(" · ");
}

const L = {
  plural: "Étlap",
  singular: "tétel",
  title: "Név",
  section: "Szekció",
  description: "Leírás",
  descriptionHint: "Összetevők, elkészítés – röviden",
  price: "Ár (Ft)",
  volume: "Kiszerelés / adag",
  volumeHint: "pl. 0,5 l, 3 dl, 250 g, 2 fő részére",
  abv: "Alkoholtartalom (%)",
  allergens: "Allergének",
  allergensHelp:
    "Az uniós szabályok (1169/2011/EU rendelet) szerint ezt a 14 allergént a vendéglátóhelyeken is fel kell tüntetni, ha az étel vagy ital tartalmazza – akár nyomokban is, ha a receptben szerepel.\n\nJelöld be mindet, ami az ételben van. A weboldal ebből automatikusan kiírja őket (pl. ikonokkal), így a vendégnek nem kell rákérdeznie.",
  diets: "Jelölések",
  available: "Elérhető",
  availableHelp:
    "Ha egy étel elfogyott vagy átmenetileg nem kapható, kapcsold ki: a weboldal étlapján nem jelenik meg, de nem kell törölnöd, és később egy kattintással visszakapcsolható. A listában a „Elérhető / Elfogyott” jelvényre kattintva is váltható.",
  soldOut: "Elfogyott",
  inStock: "Elérhető",
  allergenCount: "allergén",
  unavailable: "elfogyott",
};

export const menuDef: ContentTypeDef = {
  addonId: "menu",
  entity: "menuItem",
  icon: UtensilsCrossedIcon,
  labels: () => ({ plural: L.plural, singular: L.singular, title: L.title }),
  hasPage: false,
  maxImages: 1,
  defaults: () => ({ section: menuSections()[0], available: true, status: "published" }),
  filter: { field: "section", label: L.section, options: menuSections },
  fields: () => [
    {
      name: "section",
      label: L.section,
      type: "select",
      required: true,
      options: menuSections().map((s) => ({ value: s, label: s })),
    },
    { name: "price", label: L.price, type: "money", required: true },
    {
      name: "description",
      label: L.description,
      type: "textarea",
      required: false,
      wide: true,
      hint: L.descriptionHint,
    },
    { name: "volume", label: L.volume, type: "text", required: false, hint: L.volumeHint },
    { name: "abv", label: L.abv, type: "number", required: false, nullable: true },
    {
      name: "allergens",
      label: L.allergens,
      type: "tags",
      required: false,
      optionsOnly: true,
      wide: true,
      help: L.allergensHelp,
      options: ALLERGENS.map((a) => ({ value: a, label: a })),
    },
    {
      name: "diets",
      label: L.diets,
      type: "tags",
      required: false,
      optionsOnly: true,
      wide: true,
      options: DIETS.map((d) => ({ value: d, label: d })),
    },
    {
      name: "available",
      label: L.available,
      type: "boolean",
      required: false,
      help: L.availableHelp,
    },
  ],
  validate: (values): Record<string, string> => {
    const abv = String(values.abv ?? "")
      .trim()
      .replace(",", ".");
    return abv && (Number(abv) < 0 || Number(abv) > 100) ? { abv: "0 és 100 közötti szám" } : {};
  },
  columns: (_core, { patch }) => [
    {
      key: "section",
      header: L.section,
      hideOnMobile: true,
      cell: (i) => <Badge variant="outline">{String(i.section ?? "—")}</Badge>,
    },
    { key: "price", header: "Ár", cell: (i) => menuPrice(i) || "—" },
    {
      key: "tags",
      header: L.diets,
      hideOnMobile: true,
      cell: (i) => {
        const allergens = allergensOf(i);
        return (
          <span className="flex flex-wrap gap-1">
            {dietsOf(i).map((d) => (
              <Badge key={d} variant="success">
                {d}
              </Badge>
            ))}
            {allergens.length > 0 && (
              <Badge variant="outline" title={allergens.join(", ")}>
                {allergens.length} {L.allergenCount}
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      key: "available",
      header: L.available,
      cell: (i) => (
        <button
          type="button"
          onClick={() => patch(i.id, { available: !isAvailable(i) })}
          aria-pressed={isAvailable(i)}
          aria-label={`${L.available}: ${i.title}`}
          className="rounded-full"
        >
          <Badge variant={isAvailable(i) ? "success" : "danger"}>
            {isAvailable(i) ? L.inStock : L.soldOut}
          </Badge>
        </button>
      ),
    },
  ],
  preview: (i) => String(i.description ?? ""),
  stats: (items) => {
    const n = items.filter((i) => !isAvailable(i)).length;
    return n ? [{ label: L.unavailable, value: String(n) }] : [];
  },
  seed: () => {
    const [starters, soups, mains, desserts, drinks] = [...menuSections(), ...DEFAULT_SECTIONS];
    return [
      {
        title: "Házi libamájpástétom",
        section: starters,
        price: 3490,
        description: "Briós, birsalmazselé",
        allergens: ["Glutén", "Tojás", "Tej (laktóz)"],
        status: "published",
      },
      {
        title: "Grillezett kecskesajt",
        section: starters,
        price: 2890,
        description: "Céklasaláta, dió, méz",
        allergens: ["Tej (laktóz)", "Diófélék"],
        diets: ["Vegetáriánus"],
        status: "published",
      },
      {
        title: "Újházi tyúkhúsleves",
        section: soups,
        price: 1890,
        description: "Csigatészta, főtt zöldségek",
        allergens: ["Glutén", "Tojás", "Zeller"],
        status: "published",
        featured: true,
      },
      {
        title: "Sütőtökkrémleves",
        section: soups,
        price: 1690,
        description: "Pirított tökmag, kókusztej",
        diets: ["Vegán", "Gluténmentes"],
        status: "published",
      },
      {
        title: "Bécsi szelet",
        section: mains,
        price: 4890,
        description: "Petrezselymes burgonya, uborkasaláta",
        allergens: ["Glutén", "Tojás", "Tej (laktóz)"],
        status: "published",
        featured: true,
      },
      {
        title: "Harcsapaprikás",
        section: mains,
        price: 4590,
        description: "Túrós csusza, tejföl",
        allergens: ["Hal", "Glutén", "Tej (laktóz)"],
        diets: ["Csípős"],
        status: "published",
      },
      {
        title: "Gombás rizottó",
        section: mains,
        price: 3990,
        description: "Szarvasgomba-olaj, parmezán",
        allergens: ["Tej (laktóz)"],
        diets: ["Vegetáriánus", "Gluténmentes"],
        status: "published",
        available: false,
      },
      {
        title: "Somlói galuska",
        section: desserts,
        price: 1990,
        description: "Csokoládéöntet, tejszínhab",
        allergens: ["Glutén", "Tojás", "Tej (laktóz)", "Diófélék"],
        status: "published",
        featured: true,
      },
      {
        title: "Málnás túrótorta",
        section: desserts,
        price: 1790,
        allergens: ["Glutén", "Tojás", "Tej (laktóz)"],
        status: "published",
      },
      {
        title: "Házi limonádé",
        section: drinks,
        price: 1290,
        volume: "0,5 l",
        description: "Bodza vagy menta",
        diets: ["Vegán"],
        status: "published",
      },
      {
        title: "Csapolt sör",
        section: drinks,
        price: 1190,
        volume: "0,5 l",
        abv: 5,
        allergens: ["Glutén"],
        status: "published",
      },
      {
        title: "Egri bikavér",
        section: drinks,
        price: 1590,
        volume: "1,5 dl",
        abv: 13,
        allergens: ["Kén-dioxid, szulfitok"],
        status: "draft",
      },
    ];
  },
};
