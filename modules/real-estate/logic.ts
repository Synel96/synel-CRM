/* Az ingatlanos bővítmény tiszta üzleti logikája (unit-tesztelt). */
import { detachRelated, newId } from "@/src/crm/operations";
import type { Collection, CrmData, Id } from "@/src/crm/types";
import type { BuyerSearch, Property, RealEstateData } from "./types";

export const emptyRealEstate = (): RealEstateData => ({ properties: [], searches: [] });

/** Betöltött adat normalizálása (régi/hiányos mentésekhez). */
export function normalizeRealEstate(raw: unknown): RealEstateData {
  const v = (raw ?? {}) as Partial<RealEstateData>;
  return {
    properties: Array.isArray(v.properties)
      ? v.properties.map((p) => ({ ...p, photos: Array.isArray(p.photos) ? p.photos : [] }))
      : [],
    searches: Array.isArray(v.searches) ? v.searches : [],
  };
}

export const OWN_ID_PATTERN = /^[0-9A-Za-z_-]{1,15}$/;

/** Egyedi, ingatlan.com-kompatibilis azonosító (pl. "RE-M3K9Q2"). */
export function generateOwnId(existing: { ownId: string }[], now = Date.now()): string {
  const taken = new Set(existing.map((p) => p.ownId));
  let n = now;
  for (;;) {
    const id = `RE-${n.toString(36).toUpperCase().slice(-6)}`;
    if (!taken.has(id)) return id;
    n += 1;
  }
}

export function validateOwnId(ownId: string, existing: Property[], selfId?: Id): string | null {
  if (!OWN_ID_PATTERN.test(ownId)) return "format";
  if (existing.some((p) => p.ownId === ownId && p.id !== selfId)) return "taken";
  return null;
}

type NewProperty = Omit<Property, "id" | "createdAt" | "updatedAt" | "statusChangedAt">;
type NewSearch = Omit<BuyerSearch, "id" | "createdAt" | "updatedAt">;

export function saveProperty(
  data: RealEstateData,
  input: NewProperty,
  id: Id | null,
  now = new Date()
): { data: RealEstateData; property: Property } {
  const ts = now.toISOString();
  const existing = id ? data.properties.find((p) => p.id === id) : undefined;
  if (id && !existing) throw new Error(`Ingatlan nem található: ${id}`);
  const property: Property = existing
    ? {
        ...existing,
        ...input,
        id: existing.id,
        statusChangedAt: input.status !== existing.status ? ts : existing.statusChangedAt,
        updatedAt: ts,
      }
    : { ...input, id: newId(), createdAt: ts, updatedAt: ts, statusChangedAt: ts };
  return {
    property,
    data: {
      ...data,
      properties: existing
        ? data.properties.map((p) => (p.id === property.id ? property : p))
        : [property, ...data.properties],
    },
  };
}

export function saveSearch(
  data: RealEstateData,
  input: NewSearch,
  id: Id | null,
  now = new Date()
): RealEstateData {
  const ts = now.toISOString();
  if (id) {
    if (!data.searches.some((s) => s.id === id)) throw new Error(`Keresés nem található: ${id}`);
    return {
      ...data,
      searches: data.searches.map((s) => (s.id === id ? { ...s, ...input, id, updatedAt: ts } : s)),
    };
  }
  const search: BuyerSearch = { ...input, id: newId(), createdAt: ts, updatedAt: ts };
  return { ...data, searches: [search, ...data.searches] };
}

/** Ingatlan törlése + a hozzá tartozó tevékenységek/feladat-hivatkozások takarítása. */
export function removeProperty(
  data: RealEstateData,
  core: CrmData,
  id: Id
): [RealEstateData, CrmData] {
  return [
    { ...data, properties: data.properties.filter((p) => p.id !== id) },
    detachRelated(core, { type: "property", id }),
  ];
}

export function removeSearch(data: RealEstateData, id: Id): RealEstateData {
  return { ...data, searches: data.searches.filter((s) => s.id !== id) };
}

/** Kapcsolat törlésekor: tulajdonos-hivatkozás törlése, keresései törlése. */
export function onCoreRemove(data: RealEstateData, collection: Collection, id: Id): RealEstateData {
  if (collection !== "contacts") return data;
  return {
    properties: data.properties.map((p) =>
      p.ownerContactId === id ? { ...p, ownerContactId: null } : p
    ),
    searches: data.searches.filter((s) => s.contactId !== id),
  };
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function cityMatches(property: Property, wanted: string): boolean {
  const w = norm(wanted);
  if (!w) return true;
  const city = norm(property.city);
  const full = norm(`${property.city} ${property.district}`);
  return city === w || full === w || full.startsWith(`${w} `);
}

/**
 * Megfelel-e egy (aktív) ingatlan egy (aktív) keresési igénynek.
 * Üres feltétel = nincs megkötés.
 */
export function matches(search: BuyerSearch, property: Property): boolean {
  if (!search.active || property.status !== "active") return false;
  if (search.listingType !== property.listingType) return false;
  if (search.propertyTypes.length && !search.propertyTypes.includes(property.propertyType)) {
    return false;
  }
  if (search.cities.length && !search.cities.some((c) => cityMatches(property, c))) return false;
  if (search.priceMin !== null && property.price < search.priceMin) return false;
  if (search.priceMax !== null && property.price > search.priceMax) return false;
  if (search.areaMin !== null && (property.areaSize ?? 0) < search.areaMin) return false;
  if (search.roomsMin !== null && (property.roomCount ?? 0) < search.roomsMin) return false;
  return true;
}

export const matchingSearches = (data: RealEstateData, property: Property) =>
  data.searches.filter((s) => matches(s, property));

export const matchingProperties = (data: RealEstateData, search: BuyerSearch) =>
  data.properties.filter((p) => matches(search, p));

export function stats(data: RealEstateData) {
  const active = data.properties.filter((p) => p.status === "active");
  const activeSearches = data.searches.filter((s) => s.active);
  return {
    active: active.length,
    portfolioSaleValue: active
      .filter((p) => p.listingType === "sale")
      .reduce((sum, p) => sum + p.price, 0),
    activeSearches: activeSearches.length,
    matchPairs: activeSearches.reduce((n, s) => n + active.filter((p) => matches(s, p)).length, 0),
  };
}

/** Rövid cím megjelenítéshez (rejtett címnél utca nélkül). */
export function shortAddress(p: Property, withStreet = true): string {
  const place = [p.city, p.district].filter(Boolean).join(" ");
  const street =
    withStreet && !p.hideAddress ? [p.street, p.houseNumber].filter(Boolean).join(" ") : "";
  return [place, street].filter(Boolean).join(", ");
}
