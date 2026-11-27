import type { CrmData } from "@/src/crm/types";
import { emptyRealEstate, saveProperty, saveSearch } from "./logic";
import type { Property, RealEstateData } from "./types";

type Demo = Omit<
  Property,
  "id" | "createdAt" | "updatedAt" | "statusChangedAt" | "ownerContactId" | "custom" | "photos"
>;

const base = {
  street: "",
  houseNumber: "",
  hideAddress: true,
  lotSize: null,
  halfRoomCount: null,
  hasElevator: false,
  hasBalcony: false,
  commissionPct: 3,
  exclusive: false,
  notes: "",
} as const;

const DEMO: Demo[] = [
  {
    ...base,
    ownId: "RE-1001",
    title: "Panorámás, felújított lakás a Gellérthegy lábánál",
    listingType: "sale",
    propertyType: "flat",
    status: "active",
    price: 64_900_000,
    city: "Budapest",
    district: "XI.",
    street: "Bartók Béla út",
    areaSize: 58,
    roomCount: 2,
    floor: "4",
    condition: "renovated",
    heating: "gas_boiler",
    hasElevator: true,
    hasBalcony: true,
    exclusive: true,
    description: "Világos, csendes, udvari erkélyes lakás, közvetlenül a villamosmegálló mellett.",
  },
  {
    ...base,
    ownId: "RE-1002",
    title: "Kertes családi ház Budaörsön",
    listingType: "sale",
    propertyType: "house",
    status: "active",
    price: 149_000_000,
    city: "Budaörs",
    district: "",
    areaSize: 164,
    lotSize: 720,
    roomCount: 5,
    floor: "",
    condition: "good",
    heating: "heat_pump",
    description: "Csendes utcában, dupla garázzsal, gondozott kerttel.",
  },
  {
    ...base,
    ownId: "RE-1003",
    title: "Kiadó újépítésű lakás a Váci úton",
    listingType: "rent",
    propertyType: "flat",
    status: "active",
    price: 340_000,
    city: "Budapest",
    district: "XIII.",
    areaSize: 45,
    roomCount: 1,
    halfRoomCount: 1,
    floor: "6",
    condition: "new",
    heating: "district",
    hasElevator: true,
    hasBalcony: true,
    commissionPct: 50,
    description: "Bútorozott, gépesített, mélygarázs-beállóval bérelhető.",
  },
  {
    ...base,
    ownId: "RE-1004",
    title: "Belvárosi iroda tárgyalóval",
    listingType: "rent",
    propertyType: "office",
    status: "reserved",
    price: 890_000,
    city: "Budapest",
    district: "V.",
    areaSize: 120,
    roomCount: 4,
    floor: "2",
    condition: "renovated",
    heating: "district",
    hasElevator: true,
    description: "Reprezentatív iroda a Szabadság tér közelében.",
  },
  {
    ...base,
    ownId: "RE-1005",
    title: "Felújítandó téglalakás Szegeden",
    listingType: "sale",
    propertyType: "flat",
    status: "active",
    price: 32_500_000,
    city: "Szeged",
    district: "",
    areaSize: 62,
    roomCount: 2,
    halfRoomCount: 1,
    floor: "1",
    condition: "needs_renovation",
    heating: "gas_convector",
    description: "Egyetemhez közel, befektetésnek is ideális.",
  },
  {
    ...base,
    ownId: "RE-1006",
    title: "Balatoni nyaraló vízparthoz közel",
    listingType: "sale",
    propertyType: "holiday",
    status: "sold",
    price: 78_000_000,
    city: "Siófok",
    district: "",
    areaSize: 86,
    lotSize: 410,
    roomCount: 3,
    floor: "",
    condition: "good",
    heating: "electric",
    description: "Eladva – referencia.",
  },
];

export function seedRealEstate(core: CrmData): RealEstateData {
  let data = emptyRealEstate();
  const contacts = core.contacts;
  const owner = (i: number) => contacts[i % Math.max(1, contacts.length)]?.id ?? null;

  DEMO.forEach((p, i) => {
    data = saveProperty(
      data,
      { ...p, photos: [], ownerContactId: owner(i), custom: {} },
      null
    ).data;
  });

  const searches = [
    {
      listingType: "sale" as const,
      propertyTypes: ["flat"],
      cities: ["Budapest XI.", "Budapest XII."],
      priceMin: null,
      priceMax: 70_000_000,
      areaMin: 50,
      roomsMin: 2,
    },
    {
      listingType: "rent" as const,
      propertyTypes: ["flat"],
      cities: ["Budapest"],
      priceMin: null,
      priceMax: 400_000,
      areaMin: null,
      roomsMin: 1,
    },
    {
      listingType: "sale" as const,
      propertyTypes: ["house"],
      cities: ["Budaörs", "Törökbálint"],
      priceMin: 100_000_000,
      priceMax: 160_000_000,
      areaMin: 120,
      roomsMin: 4,
    },
  ];
  searches.forEach((s, i) => {
    data = saveSearch(
      data,
      { ...s, contactId: owner(i + 3), active: true, notes: "", custom: {} },
      null
    );
  });
  return data;
}
