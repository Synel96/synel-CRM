import { describe, expect, it } from "vitest";
import crmConfig from "@/crm.config";
import { ensureAddonData } from "@/src/crm/addon-data";
import { createRecord } from "@/src/crm/operations";
import { createDemoData } from "@/src/crm/seed";
import { memoryAdapter } from "@/src/crm/storage";
import { createCrmStore } from "@/src/crm/store";
import { emptyData } from "@/src/crm/types";
import realEstateAddon from "./index";
import {
  emptyRealEstate,
  generateOwnId,
  matches,
  matchingProperties,
  normalizeRealEstate,
  onCoreRemove,
  removeProperty,
  saveProperty,
  stats,
  validateOwnId,
} from "./logic";
import { seedRealEstate } from "./seed";
import type { BuyerSearch, Property, RealEstateData } from "./types";

const NOW = new Date(2026, 10, 15, 12);

function property(over: Partial<Property> = {}): Property {
  return {
    id: "p1",
    createdAt: "",
    updatedAt: "",
    statusChangedAt: "",
    custom: {},
    ownId: "RE-1",
    title: "Lakás",
    listingType: "sale",
    propertyType: "flat",
    status: "active",
    price: 60_000_000,
    city: "Budapest",
    district: "XI.",
    street: "",
    houseNumber: "",
    hideAddress: true,
    areaSize: 55,
    lotSize: null,
    roomCount: 2,
    halfRoomCount: null,
    floor: "",
    condition: null,
    heating: null,
    hasElevator: false,
    hasBalcony: false,
    description: "",
    photos: [],
    ownerContactId: null,
    commissionPct: null,
    exclusive: false,
    notes: "",
    ...over,
  };
}

function search(over: Partial<BuyerSearch> = {}): BuyerSearch {
  return {
    id: "s1",
    createdAt: "",
    updatedAt: "",
    custom: {},
    contactId: "c1",
    listingType: "sale",
    propertyTypes: [],
    cities: [],
    priceMin: null,
    priceMax: null,
    areaMin: null,
    roomsMin: null,
    active: true,
    notes: "",
    ...over,
  };
}

describe("párosítás", () => {
  it("feltételek nélküli keresés minden aktív, azonos típusú hirdetésre illik", () => {
    expect(matches(search(), property())).toBe(true);
    expect(matches(search({ listingType: "rent" }), property())).toBe(false);
    expect(matches(search(), property({ status: "reserved" }))).toBe(false);
    expect(matches(search({ active: false }), property())).toBe(false);
  });

  it("ár, alapterület, szobaszám és ingatlantípus szerint szűr", () => {
    expect(matches(search({ priceMax: 59_999_999 }), property())).toBe(false);
    expect(matches(search({ priceMin: 50_000_000, priceMax: 60_000_000 }), property())).toBe(true);
    expect(matches(search({ areaMin: 56 }), property())).toBe(false);
    expect(matches(search({ roomsMin: 2 }), property())).toBe(true);
    expect(matches(search({ roomsMin: 3 }), property())).toBe(false);
    expect(matches(search({ propertyTypes: ["house"] }), property())).toBe(false);
    expect(matches(search({ propertyTypes: ["house", "flat"] }), property())).toBe(true);
    expect(matches(search({ areaMin: 10 }), property({ areaSize: null }))).toBe(false);
  });

  it("település / kerület: ékezet-, pont- és kisbetű-független", () => {
    const p = property();
    expect(matches(search({ cities: ["budapest"] }), p)).toBe(true);
    expect(matches(search({ cities: ["Budapest XI"] }), p)).toBe(true);
    expect(matches(search({ cities: ["Budapest XI."] }), p)).toBe(true);
    expect(matches(search({ cities: ["Budapest XII."] }), p)).toBe(false);
    expect(matches(search({ cities: ["Budapest X."] }), p)).toBe(false);
    expect(matches(search({ cities: ["Budaörs", "Budapest XI."] }), p)).toBe(true);
    expect(
      matches(search({ cities: ["Gödöllő"] }), property({ city: "Godollo", district: "" }))
    ).toBe(true);
  });
});

describe("hirdetésazonosító", () => {
  it("ingatlan.com-kompatibilis és egyedi", () => {
    const existing = [property({ ownId: "RE-1" })];
    const id = generateOwnId(existing, NOW.getTime());
    expect(id).toMatch(/^[0-9A-Za-z_-]{1,15}$/);
    expect(generateOwnId([property({ ownId: id })], NOW.getTime())).not.toBe(id);
    expect(validateOwnId("RE-1", existing)).toBe("taken");
    expect(validateOwnId("RE-1", existing, "p1")).toBeNull(); // saját magát nem ütközteti
    expect(validateOwnId("túl hosszú azonosító!", existing)).toBe("format");
  });
});

describe("mentés és törlés", () => {
  it("státuszváltáskor frissül a statusChangedAt", () => {
    let data: RealEstateData = emptyRealEstate();
    const { property: created, data: d1 } = saveProperty(
      data,
      property({ status: "draft" }),
      null,
      new Date("2026-01-01T00:00:00Z")
    );
    data = saveProperty(
      d1,
      { ...created, title: "Új cím" },
      created.id,
      new Date("2026-02-01T00:00:00Z")
    ).data;
    expect(data.properties[0].statusChangedAt).toBe("2026-01-01T00:00:00.000Z");
    data = saveProperty(
      data,
      { ...created, status: "sold" },
      created.id,
      new Date("2026-03-01T00:00:00Z")
    ).data;
    expect(data.properties[0].statusChangedAt).toBe("2026-03-01T00:00:00.000Z");
  });

  it("ingatlan törlésekor a tevékenységei törlődnek, a feladat hivatkozás nélkül marad", () => {
    let core = emptyData();
    core = createRecord(core, "activities", {
      kind: "note",
      body: "x",
      at: "",
      related: { type: "property", id: "p1" },
    }).data;
    core = createRecord(core, "tasks", {
      title: "Fotózás",
      dueDate: null,
      done: false,
      priority: "normal",
      related: { type: "property", id: "p1" },
      notes: "",
    }).data;
    const [re, nextCore] = removeProperty({ properties: [property()], searches: [] }, core, "p1");
    expect(re.properties).toHaveLength(0);
    expect(nextCore.activities).toHaveLength(0);
    expect(nextCore.tasks[0].related).toBeNull();
  });

  it("kapcsolat törlésekor a tulajdonos-hivatkozás null, a keresései törlődnek", () => {
    const data = onCoreRemove(
      {
        properties: [property({ ownerContactId: "c1" })],
        searches: [search({ contactId: "c1" }), search({ id: "s2", contactId: "c2" })],
      },
      "contacts",
      "c1"
    );
    expect(data.properties[0].ownerContactId).toBeNull();
    expect(data.searches.map((s) => s.id)).toEqual(["s2"]);
  });

  it("hiányos mentett adat normalizálása", () => {
    expect(normalizeRealEstate(undefined)).toEqual(emptyRealEstate());
    expect(normalizeRealEstate({ properties: [{ id: "x" }] }).properties[0].photos).toEqual([]);
  });
});

describe("mintaadatok és store-integráció", () => {
  it("a mintaadatban vannak párosítások", () => {
    const re = seedRealEstate(createDemoData(crmConfig, NOW));
    const s = stats(re);
    expect(s.active).toBeGreaterThan(0);
    expect(s.matchPairs).toBeGreaterThan(0);
    expect(re.searches.every((x) => matchingProperties(re, x).length > 0)).toBe(true);
  });

  it("utólag bekapcsolt bővítmény üres adattal indul, meglévő adatot nem ír felül", () => {
    const core = createDemoData(crmConfig, NOW);
    const added = ensureAddonData(core, [realEstateAddon], crmConfig, { seed: false });
    expect(added.addons["real-estate"]).toEqual(emptyRealEstate());
    const seeded = ensureAddonData(core, [realEstateAddon], crmConfig, { seed: true });
    const again = ensureAddonData(seeded, [realEstateAddon], crmConfig, { seed: true });
    expect(again.addons["real-estate"]).toEqual(seeded.addons["real-estate"]);
  });

  it("store: kapcsolat törlése a bővítmény adatait is takarítja", async () => {
    const store = createCrmStore(memoryAdapter(), {
      config: crmConfig,
      addons: [realEstateAddon],
      seedDemoData: true,
    });
    await store.start();
    const re = () => store.getState().data.addons["real-estate"] as RealEstateData;
    const owner = re().properties.find((p) => p.ownerContactId)!.ownerContactId!;
    store.remove("contacts", owner);
    expect(re().properties.some((p) => p.ownerContactId === owner)).toBe(false);
    expect(re().searches.some((s) => s.contactId === owner)).toBe(false);
  });
});
