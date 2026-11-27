import type { BaseRecord, Id } from "@/src/crm/types";

export const ADDON_ID = "real-estate";

export const LISTING_TYPES = ["sale", "rent"] as const;
export const PROPERTY_TYPES = [
  "flat",
  "house",
  "plot",
  "office",
  "commercial",
  "garage",
  "holiday",
  "other",
] as const;
export const PROPERTY_STATUSES = [
  "draft",
  "active",
  "reserved",
  "sold",
  "rented",
  "withdrawn",
] as const;
export const CONDITIONS = [
  "new",
  "renovated",
  "good",
  "average",
  "needs_renovation",
  "shell",
] as const;
export const HEATING_TYPES = [
  "gas_boiler",
  "gas_convector",
  "district",
  "electric",
  "heat_pump",
  "other",
] as const;

export type ListingType = (typeof LISTING_TYPES)[number];
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

/** Ingatlan.com: legfeljebb 30 fotó hirdetésenként. */
export const MAX_PHOTOS = 30;

export interface PropertyPhoto {
  id: string;
  /** https URL (Cloudinary vagy külső) vagy helyi tárolásnál data: URL. */
  url: string;
  caption: string;
  /** Cloudinary public_id – később törléshez / portálszinkronhoz. */
  publicId?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface Property extends BaseRecord {
  /**
   * Saját hirdetésazonosító. Formátuma megegyezik az ingatlan.com
   * Automata betöltés `ownId`-jával (max. 15 karakter, A-Z a-z 0-9 _ -),
   * így később portálszinkronnál változtatás nélkül használható.
   */
  ownId: string;
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  status: PropertyStatus;
  statusChangedAt: string; // ISO
  /** Eladásnál teljes ár, kiadásnál havi díj. */
  price: number;

  city: string;
  district: string; // pl. "XI." – Budapesten
  street: string;
  houseNumber: string;
  hideAddress: boolean;

  areaSize: number | null; // m²
  lotSize: number | null; // m²
  roomCount: number | null;
  halfRoomCount: number | null;
  floor: string;
  condition: (typeof CONDITIONS)[number] | null;
  heating: (typeof HEATING_TYPES)[number] | null;
  hasElevator: boolean;
  hasBalcony: boolean;

  description: string;
  photos: PropertyPhoto[];

  /** Eladó / bérbeadó (kapcsolat). */
  ownerContactId: Id | null;
  commissionPct: number | null;
  exclusive: boolean;
  notes: string;
}

/** Vevő / bérlő keresési igénye – ez alapján párosít az ingatlanokkal. */
export interface BuyerSearch extends BaseRecord {
  contactId: Id | null;
  listingType: ListingType;
  propertyTypes: string[]; // üres = bármilyen
  cities: string[]; // üres = bárhol; településnév vagy pl. "Budapest XI."
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  roomsMin: number | null;
  active: boolean;
  notes: string;
}

export interface RealEstateData {
  properties: Property[];
  searches: BuyerSearch[];
}
