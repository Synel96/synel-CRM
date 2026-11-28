/*
 * Üzlettípus-profilok. A crm.config.ts `industry` kulcsa választ egyet, és a
 * profil adja az alapértelmezéseket (modulok, bővítmények, menünevek,
 * pipeline, címkék, egyedi mezők, mintaadatok). Az ügyfél configja bármit
 * felülírhat – lásd mergeWithIndustry().
 *
 * Új üzlettípus: vegyél fel egy profilt az INDUSTRIES-be (és ha kell, a
 * hozzá tartozó bővítményeket a modules/ alá).
 */
import type { ClientConfigInput, CrmConfigInput } from "./config";

export const INDUSTRY_IDS = ["general", "agency", "real-estate", "hospitality"] as const;
export type IndustryId = (typeof INDUSTRY_IDS)[number];

type ProfileDefaults = Pick<
  CrmConfigInput,
  | "modules"
  | "addons"
  | "labels"
  | "pipeline"
  | "contactTags"
  | "customFields"
  | "addonSettings"
  | "dashboard"
>;

export type IndustryProfile = {
  id: IndustryId;
  /** Megjelenítendő név (Beállítások oldal). */
  name: string;
  defaults: ProfileDefaults;
  /** Mintaadatok a mag moduljaihoz (üzletek, feladatok, tevékenységek szövege). */
  demo: {
    /** Üzletek: [cím, érték, egyedi mezők (opcionális, pl. vendégszám)] */
    deals: [string, number, Record<string, string | number>?][];
    tasks: string[];
    activities?: [string, string, string, string];
  };
};

const sources = (...extra: string[]) => ({
  key: "source",
  label: "Forrás",
  type: "select" as const,
  options: ["Weboldal", "Ajánlás", "Google", "Közösségi média", ...extra],
  showInList: true,
});

export const INDUSTRIES: Record<IndustryId, IndustryProfile> = {
  general: {
    id: "general",
    name: "Általános",
    defaults: {
      modules: { companies: true, deals: true, tasks: true },
      addons: [],
      pipeline: [
        { id: "lead", label: "Új érdeklődő", probability: 10 },
        { id: "qualified", label: "Minősített", probability: 30 },
        { id: "proposal", label: "Ajánlat kiküldve", probability: 60 },
        { id: "negotiation", label: "Tárgyalás", probability: 80 },
        { id: "won", label: "Megnyert", probability: 100, kind: "won" },
        { id: "lost", label: "Elvesztett", probability: 0, kind: "lost" },
      ],
      contactTags: ["Partner", "VIP", "Hideg lead"],
      customFields: {
        contact: [
          sources("Rendezvény"),
          { key: "newsletter", label: "Hírlevélre feliratkozott", type: "boolean" },
        ],
        company: [{ key: "taxNumber", label: "Adószám", type: "text" }],
      },
    },
    demo: {
      deals: [
        ["Éves szoftverlicenc", 2_400_000],
        ["Weboldal újratervezés", 1_150_000],
        ["Karbantartási szerződés", 600_000],
        ["Raktárautomatizálás", 8_900_000],
        ["Tanácsadási csomag", 450_000],
        ["Marketingkampány Q1", 1_800_000],
        ["Irodai hálózat bővítés", 3_200_000],
        ["Webshop integráció", 2_750_000],
      ],
      tasks: [
        "Ajánlat elküldése",
        "Visszahívás egyeztetés miatt",
        "Szerződéstervezet átnézése",
        "Bemutató előkészítése",
        "Hírlevél-lista frissítése",
      ],
    },
  },

  agency: {
    id: "agency",
    name: "Webstúdió / ügynökség",
    defaults: {
      modules: { companies: true, deals: true, tasks: true },
      addons: ["services", "projects", "testimonials", "blog", "gallery"],
      labels: { deals: "Ajánlatok" },
      pipeline: [
        { id: "lead", label: "Érdeklődő", probability: 10 },
        { id: "discovery", label: "Igényfelmérés", probability: 30 },
        { id: "proposal", label: "Árajánlat kiküldve", probability: 50 },
        { id: "negotiation", label: "Tárgyalás", probability: 75 },
        { id: "won", label: "Megrendelve", probability: 100, kind: "won" },
        { id: "lost", label: "Elvesztett", probability: 0, kind: "lost" },
      ],
      dashboard: {
        kpis: ["openDeals", "pipelineValue", "weightedValue", "wonThisMonth", "overdueTasks"],
        cards: ["pipeline", "tasks", "activity"],
      },
      contactTags: ["Partner", "VIP", "Ajánlásból", "Karbantartási szerződés"],
      customFields: {
        contact: [sources("Rendezvény")],
        company: [{ key: "taxNumber", label: "Adószám", type: "text" }],
        deal: [
          {
            key: "projectType",
            label: "Projekt típusa",
            type: "select",
            options: ["Weboldal", "Webshop", "CRM", "Arculat", "Karbantartás", "SEO"],
            showInList: true,
          },
        ],
      },
    },
    demo: {
      deals: [
        ["Weboldal-újratervezés", 850_000],
        ["Webshop fejlesztés", 1_600_000],
        ["CRM-bevezetés", 450_000],
        ["Éves karbantartás", 180_000],
        ["Arculattervezés", 320_000],
        ["SEO-csomag", 240_000],
        ["Landing oldal kampányhoz", 220_000],
        ["Online foglalási rendszer", 980_000],
      ],
      tasks: [
        "Árajánlat elküldése",
        "Igényfelmérő hívás",
        "Dizájnterv bemutatása",
        "Tartalmak bekérése az ügyféltől",
        "Havi karbantartási riport",
      ],
      activities: [
        "Bemutatkozó hívás: új weboldalt szeretnének a tavaszi szezonra.",
        "Elküldtem az árajánlatot és a referenciákat.",
        "Igényfelmérő meeting: 8 aloldal, online foglalás, blog.",
        "Keret kb. 900 E Ft, március végéig élesíteni szeretnék.",
      ],
    },
  },

  "real-estate": {
    id: "real-estate",
    name: "Ingatlaniroda",
    defaults: {
      modules: { companies: false, deals: true, tasks: true },
      addons: ["real-estate", "testimonials", "blog"],
      labels: { contacts: "Ügyfelek", deals: "Ügyletek" },
      pipeline: [
        { id: "inquiry", label: "Érdeklődés", probability: 10 },
        { id: "viewing", label: "Megtekintés", probability: 30 },
        { id: "offer", label: "Vételi ajánlat", probability: 60 },
        { id: "deposit", label: "Foglaló", probability: 85 },
        { id: "closed", label: "Adásvétel / bérleti szerződés", probability: 100, kind: "won" },
        { id: "failed", label: "Meghiúsult", probability: 0, kind: "lost" },
      ],
      dashboard: {
        addonsFirst: true,
        kpis: ["openDeals", "wonThisMonth", "overdueTasks", "contacts"],
        cards: ["tasks", "activity", "pipeline"],
      },
      contactTags: ["Eladó", "Vevő", "Bérlő", "Bérbeadó", "Befektető"],
      customFields: {
        contact: [sources("ingatlan.com", "Tábla")],
        property: [{ key: "energyCert", label: "Energetikai tanúsítvány", type: "text" }],
      },
    },
    demo: {
      deals: [
        ["Panorámás lakás – adásvétel", 64_900_000],
        ["Kertes ház Budaörsön – vevő", 149_000_000],
        ["Váci úti lakás bérbeadása", 340_000],
        ["Belvárosi iroda bérlése", 890_000],
        ["Szegedi lakás – befektető", 32_500_000],
        ["Balatoni nyaraló – adásvétel", 78_000_000],
        ["Zuglói sorház – értékbecslés", 95_000_000],
        ["Óbudai garzon – bérbeadás", 220_000],
      ],
      tasks: [
        "Megtekintés egyeztetése",
        "Értékbecslés megrendelése",
        "Fotózás időpont",
        "Adásvételi szerződés előkészítése",
        "Hirdetés frissítése",
      ],
      activities: [
        "Érdeklődött a XI. kerületi lakás iránt, megtekintést kér.",
        "Elküldtem az alaprajzot és a fotókat.",
        "Megtekintés a helyszínen, komoly érdeklődő.",
        "Max. 70 M Ft, banki hitellel vásárolna.",
      ],
    },
  },

  hospitality: {
    id: "hospitality",
    name: "Vendéglátóhely",
    defaults: {
      modules: { companies: true, deals: true, tasks: true },
      addons: ["menu", "offers", "gallery", "testimonials"],
      labels: { contacts: "Vendégek", deals: "Rendezvények" },
      pipeline: [
        { id: "inquiry", label: "Érdeklődés", probability: 20 },
        { id: "proposal", label: "Menüajánlat kiküldve", probability: 50 },
        { id: "deposit", label: "Foglaló beérkezett", probability: 85 },
        { id: "held", label: "Megtartva", probability: 100, kind: "won" },
        { id: "cancelled", label: "Lemondva", probability: 0, kind: "lost" },
      ],
      dashboard: {
        dealDateField: "eventDate",
        dealSumField: "guests",
        kpis: ["upcomingDeals", "upcomingSum", "openDeals", "wonThisMonth", "overdueTasks"],
        cards: ["upcomingDeals", "tasks", "activity", "pipeline"],
      },
      contactTags: ["Törzsvendég", "Céges", "Rendezvényszervező", "Ételallergia"],
      customFields: {
        contact: [
          sources("Telefon", "Betért"),
          { key: "dietary", label: "Étkezési igény / allergia", type: "text", showInList: true },
        ],
        deal: [
          {
            key: "eventType",
            label: "Rendezvény típusa",
            type: "select",
            options: ["Céges vacsora", "Esküvő", "Születésnap", "Konferencia", "Egyéb"],
            showInList: true,
          },
          { key: "guests", label: "Vendégek száma", type: "number", showInList: true },
          { key: "eventDate", label: "Rendezvény dátuma", type: "date", showInList: true },
        ],
      },
    },
    demo: {
      deals: [
        ["Céges évzáró vacsora – 40 fő", 680_000, { guests: 40 }],
        ["Esküvői vacsora – 80 fő", 2_400_000, { guests: 80 }],
        ["Születésnapi ebéd – 15 fő", 180_000, { guests: 15 }],
        ["Konferencia-ebéd – 60 fő", 720_000, { guests: 60 }],
        ["Karácsonyi céges buli", 950_000, { guests: 55 }],
        ["Ballagási ebéd", 260_000, { guests: 22 }],
        ["Eljegyzési vacsora", 140_000, { guests: 12 }],
        ["Csapatépítő főzőkurzus", 390_000, { guests: 18 }],
      ],
      tasks: [
        "Menüajánlat küldése az évzáróhoz",
        "Foglaló visszaigazolása",
        "Allergénlista egyeztetése",
        "Terem-elrendezés véglegesítése",
        "Beszállítói rendelés a hétvégére",
      ],
      activities: [
        "Céges évzárót szervez 40 főre, december közepére.",
        "Elküldtem a háromfogásos menüajánlatot és az italcsomagokat.",
        "Helyszínbejárás: a különterem tetszett, foglalót utal.",
        "2 fő laktózérzékeny, 1 vegetáriánus – jelezni a konyhának.",
      ],
    },
  },
};

export const industryOf = (id: string | undefined): IndustryProfile =>
  INDUSTRIES[(id as IndustryId) ?? "general"] ?? INDUSTRIES.general;

/**
 * A profil alapértelmezései + az ügyfél configja. Szabályok:
 * - egyszerű értékek, `addons`, `pipeline`, `contactTags`: az ügyfélé nyer;
 * - `modules`, `labels`, `addonSettings`, `dashboard`: kulcsonként összefésülve;
 * - `customFields`: entitásonként (pl. ha az ügyfél ad `deal` mezőket, azok
 *   cserélik a profil `deal` mezőit, a többi entitásé marad).
 */
export function mergeWithIndustry(input: ClientConfigInput): CrmConfigInput {
  const d = industryOf(input.industry).defaults;
  return {
    ...d,
    ...input,
    pipeline: input.pipeline ?? d.pipeline ?? [],
    modules: { ...d.modules, ...input.modules } as CrmConfigInput["modules"],
    labels: { ...d.labels, ...input.labels },
    addonSettings: { ...d.addonSettings, ...input.addonSettings },
    dashboard: { ...d.dashboard, ...input.dashboard } as CrmConfigInput["dashboard"],
    customFields: { ...d.customFields, ...input.customFields } as CrmConfigInput["customFields"],
    addons: input.addons ?? d.addons,
    contactTags: input.contactTags ?? d.contactTags,
  };
}
