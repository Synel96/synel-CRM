/*
 * Szezonális ajánlatok – vendéglátóhelyeknek (a közös tartalommotorra).
 * Érvényesség (-tól, -ig) automatikus állapottal: Hamarosan / Aktív / Lejárt,
 * ár vagy kedvezmény, az étlap tételeinek hozzákapcsolása, képek alt szöveggel.
 * A weboldalon csak az aktív ajánlat jelenjen meg (offerPhase === "active").
 */
import { CalendarHeartIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { contentOptions } from "@/src/crm/content/fields";
import type { ContentItem } from "@/src/crm/content/logic";
import type { ContentTypeDef } from "@/src/crm/content/types";
import { formatDate, formatMoney } from "@/src/crm/i18n";
import { toDateKey } from "@/src/crm/operations";

export type OfferPhase = "draft" | "upcoming" | "active" | "expired";

const dateOf = (v: unknown) => (typeof v === "string" && v ? v : null);

/** Az ajánlat állapota adott napon (helyi dátum, a határnapok is benne vannak). */
export function offerPhase(
  item: Pick<ContentItem, "status"> & Record<string, unknown>,
  now = new Date()
): OfferPhase {
  if (item.status !== "published") return "draft";
  const today = toDateKey(now);
  const from = dateOf(item.validFrom);
  const to = dateOf(item.validTo);
  if (from && today < from) return "upcoming";
  if (to && today > to) return "expired";
  return "active";
}

/** Aktív ajánlatnál hány nap van hátra (az utolsó nap = 0). */
export function daysLeft(item: Record<string, unknown>, now = new Date()): number | null {
  const to = dateOf(item.validTo);
  if (!to) return null;
  const end = new Date(`${to}T00:00:00`);
  const start = new Date(`${toDateKey(now)}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** Hamarosan lejár: aktív és legfeljebb ennyi nap van hátra. */
export const ENDING_SOON_DAYS = 7;

const L = {
  plural: "Szezonális ajánlatok",
  singular: "ajánlat",
  title: "Ajánlat neve",
  description: "Leírás",
  descriptionHint: "Mit kap a vendég? pl. 3 fogásos menü, libás ételek, nyári koktélok",
  validFrom: "Érvényes ettől",
  validTo: "Érvényes eddig",
  validHelp:
    "Az ajánlat ebben az időszakban jelenik meg a weboldalon (a kezdő és a záró nap is benne van). Előre is felviheted: a kezdőnapig „Hamarosan” állapotú, utána magától „Aktív”, a záró nap után „Lejárt” lesz – nem kell kézzel levenni.",
  price: "Ár (Ft)",
  priceNote: "Ár megjegyzés / kedvezmény",
  priceNoteHint: "pl. „2 fő részére”, „-20%”, „/fő”",
  items: "Az étlap tételei az ajánlatban",
  period: "Időszak",
  phase: "Állapot",
  upcoming: "Hamarosan",
  active: "Aktív",
  expired: "Lejárt",
  draft: "Vázlat",
  endsIn: (n: number) => (n === 0 ? "ma jár le" : `lejár ${n} nap múlva`),
  activeCount: "aktív",
  endingSoon: "hamarosan lejár",
  dateOrder: "A záró dátum nem lehet a kezdő előtt",
};

export function offerPeriod(i: Record<string, unknown>): string {
  const from = dateOf(i.validFrom);
  const to = dateOf(i.validTo);
  if (!from && !to) return "—";
  return `${from ? formatDate(from) : "…"} – ${to ? formatDate(to) : "…"}`;
}

export const offersDef: ContentTypeDef = {
  addonId: "offers",
  entity: "offer",
  icon: CalendarHeartIcon,
  labels: () => ({ plural: L.plural, singular: L.singular, title: L.title }),
  hasPage: true,
  maxImages: 3,
  defaults: () => ({ validFrom: toDateKey(new Date()) }),
  fields: (core) => {
    const menu = contentOptions(core, "menu");
    return [
      {
        name: "description",
        label: L.description,
        type: "textarea",
        required: false,
        wide: true,
        hint: L.descriptionHint,
      },
      { name: "validFrom", label: L.validFrom, type: "date", required: true, help: L.validHelp },
      { name: "validTo", label: L.validTo, type: "date", required: true, help: L.validHelp },
      { name: "price", label: L.price, type: "money", required: false, nullable: true },
      {
        name: "priceNote",
        label: L.priceNote,
        type: "text",
        required: false,
        hint: L.priceNoteHint,
      },
      ...(menu.length
        ? [
            {
              name: "menuItemIds",
              label: L.items,
              type: "tags" as const,
              required: false,
              optionsOnly: true,
              wide: true,
              options: menu,
            },
          ]
        : []),
    ];
  },
  validate: (values): Record<string, string> => {
    const from = String(values.validFrom ?? "");
    const to = String(values.validTo ?? "");
    return from && to && to < from ? { validTo: L.dateOrder } : {};
  },
  columns: () => [
    { key: "period", header: L.period, cell: (i) => offerPeriod(i) },
    {
      key: "phase",
      header: L.phase,
      cell: (i) => {
        const phase = offerPhase(i);
        if (phase === "draft") return <span className="text-muted-foreground">—</span>;
        const left = daysLeft(i);
        return (
          <span className="flex flex-wrap items-center gap-1">
            <Badge
              variant={phase === "active" ? "success" : phase === "upcoming" ? "accent" : "outline"}
            >
              {L[phase]}
            </Badge>
            {phase === "active" && left !== null && left <= ENDING_SOON_DAYS && (
              <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300">
                {L.endsIn(left)}
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      key: "price",
      header: "Ár",
      hideOnMobile: true,
      cell: (i) =>
        [typeof i.price === "number" ? formatMoney(i.price) : "", String(i.priceNote ?? "")]
          .filter(Boolean)
          .join(" ") || "—",
    },
  ],
  preview: (i) => String(i.description ?? ""),
  stats: (items) => {
    const active = items.filter((i) => offerPhase(i) === "active");
    const soon = active.filter((i) => (daysLeft(i) ?? 99) <= ENDING_SOON_DAYS).length;
    return [
      { label: L.activeCount, value: String(active.length) },
      ...(soon ? [{ label: L.endingSoon, value: String(soon) }] : []),
    ];
  },
  seed: (core) => {
    const day = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return toDateKey(d);
    };
    const menu = contentOptions(core, "menu");
    const pick = (...words: string[]) =>
      menu.filter((m) => words.some((w) => m.label.includes(w))).map((m) => m.value);
    return [
      {
        title: "Téli háromfogásos menü",
        description: "Újházi tyúkhúsleves, bécsi szelet, somlói galuska – hétköznap délben.",
        validFrom: day(-20),
        validTo: day(5),
        price: 5990,
        priceNote: "/fő",
        menuItemIds: pick("Újházi", "Bécsi", "Somlói"),
        status: "published",
        featured: true,
      },
      {
        title: "Szilveszteri gálavacsora",
        description: "Ötfogásos vacsora élőzenével és éjféli pezsgővel. Asztalfoglalás szükséges.",
        validFrom: day(20),
        validTo: day(21),
        price: 24900,
        priceNote: "/fő",
        status: "published",
      },
      {
        title: "Márton-napi libanapok",
        description: "Libamájpástétom, libacomb párolt káposztával, újbor.",
        validFrom: day(-40),
        validTo: day(-25),
        menuItemIds: pick("libamáj"),
        status: "published",
      },
      {
        title: "Nyári fröccsterasz",
        description: "Fröccsök, limonádék és grilltálak a teraszon.",
        validFrom: day(150),
        validTo: day(240),
        priceNote: "-20% 17 óra előtt",
        status: "draft",
      },
    ];
  },
};
