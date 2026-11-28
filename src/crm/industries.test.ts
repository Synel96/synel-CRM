import { describe, expect, it } from "vitest";
import menuAddon from "@/modules/menu";
import { ALLERGENS, DEFAULT_SECTIONS, isOnMenu, menuDef, menuSections } from "@/modules/menu/def";
import offersAddon from "@/modules/offers";
import { daysLeft, offerPhase, offersDef } from "@/modules/offers/def";
import { ensureAddonData } from "./addon-data";
import { activeAddons } from "./addon-registry";
import { defineCrmConfig } from "./config";
import { contentFields } from "./content/fields";
import { moveItem, normalizeContent, sortedItems, type ContentData } from "./content/logic";
import { INDUSTRIES, INDUSTRY_IDS, mergeWithIndustry } from "./industries";
import { createDemoData } from "./seed";
import { emptyData } from "./types";

describe("üzlettípus-profilok", () => {
  it("minden profil érvényes configot ad, és csak létező bővítményeket kapcsol be", () => {
    const known = new Set([
      "real-estate",
      "services",
      "projects",
      "menu",
      "offers",
      "testimonials",
      "blog",
      "gallery",
    ]);
    for (const id of INDUSTRY_IDS) {
      const cfg = defineCrmConfig({ industry: id, brand: { name: id } });
      expect(cfg.industry).toBe(id);
      expect(cfg.pipeline.length).toBeGreaterThan(1);
      for (const a of cfg.addons) expect(known.has(a), `${id}: ${a}`).toBe(true);
      expect(INDUSTRIES[id].demo.deals.length).toBeGreaterThan(0);
    }
    // a registry ismeri az összes bővítményt (a mostani config ellenőrzése nem dob)
    expect(() => activeAddons()).not.toThrow();
  });

  it("a vendéglátás profil: étlap, ajánlatok, rendezvények, vendégek", () => {
    const cfg = defineCrmConfig({ industry: "hospitality", brand: { name: "Bisztró" } });
    expect(cfg.addons).toEqual(["menu", "offers", "gallery", "testimonials"]);
    expect(cfg.labels).toMatchObject({ deals: "Rendezvények", contacts: "Vendégek" });
    expect(cfg.customFields.deal.map((f) => f.key)).toEqual(["eventType", "guests", "eventDate"]);
    expect(cfg.pipeline.find((s) => s.kind === "won")?.label).toBe("Megtartva");
  });

  it("felülírás: egyszerű kulcs és lista cserél, modules/labels kulcsonként fésül", () => {
    const merged = mergeWithIndustry({
      industry: "hospitality",
      brand: { name: "X" },
      addons: ["menu"],
      modules: { companies: false },
      labels: { tasks: "Teendők" },
      customFields: { contact: [] },
    });
    expect(merged.addons).toEqual(["menu"]);
    expect(merged.modules).toEqual({ companies: false, deals: true, tasks: true });
    expect(merged.labels).toEqual({
      contacts: "Vendégek",
      deals: "Rendezvények",
      tasks: "Teendők",
    });
    expect(merged.customFields?.contact).toEqual([]);
    expect(merged.customFields?.deal?.length).toBe(3); // a profilé marad
  });

  it("profil nélkül az általános profil; a mintaadat az üzlettípus szövegeit használja", () => {
    const general = defineCrmConfig({ brand: { name: "X" } });
    expect(general.industry).toBe("general");
    const hosp = defineCrmConfig({ industry: "hospitality", brand: { name: "X" } });
    const titles = createDemoData(hosp).deals.map((d) => d.title);
    expect(titles).toContain("Esküvői vacsora – 80 fő");
    expect(createDemoData(hosp).tasks.map((t) => t.title)).toContain("Allergénlista egyeztetése");
  });
});

describe("étlap", () => {
  it("14 uniós allergén, súgóval; szekciók alapból", () => {
    expect(ALLERGENS).toHaveLength(14);
    expect(menuSections()).toEqual(DEFAULT_SECTIONS);
    const fields = contentFields(menuDef, defineCrmConfig({ brand: { name: "X" } }), emptyData());
    expect(fields.find((f) => f.name === "allergens")).toMatchObject({ optionsOnly: true });
    expect(fields.find((f) => f.name === "allergens")?.help).toMatch(/1169\/2011/);
    expect(fields.find((f) => f.name === "section")?.options?.map((o) => o.value)).toEqual(
      DEFAULT_SECTIONS
    );
  });

  it("a weboldal étlapján: publikált és elérhető", () => {
    expect(isOnMenu({ status: "published", available: true } as never)).toBe(true);
    expect(isOnMenu({ status: "published" } as never)).toBe(true); // alapból elérhető
    expect(isOnMenu({ status: "published", available: false } as never)).toBe(false);
    expect(isOnMenu({ status: "draft", available: true } as never)).toBe(false);
  });

  it("alkoholtartalom ellenőrzése", () => {
    expect(menuDef.validate!({ abv: "5,5" })).toEqual({});
    expect(menuDef.validate!({ abv: "120" })).toHaveProperty("abv");
  });

  it("sorrend szekción belül: a másik szekció elemei nem mozdulnak", () => {
    let data = normalizeContent({
      items: [
        { id: "a", title: "Leves1", section: "Levesek", sortOrder: 0 },
        { id: "b", title: "Főétel1", section: "Főételek", sortOrder: 1 },
        { id: "c", title: "Leves2", section: "Levesek", sortOrder: 2 },
      ],
    });
    data = moveItem(data, "c", -1, (i) => i.section === "Levesek");
    expect(sortedItems(data.items).map((i) => i.id)).toEqual(["c", "b", "a"]);
    const soups = sortedItems(data.items)
      .filter((i) => i.section === "Levesek")
      .map((i) => i.id);
    expect(soups).toEqual(["c", "a"]);
    expect(moveItem(data, "c", -1, (i) => i.section === "Levesek")).toBe(data); // a szekció elején
  });
});

describe("szezonális ajánlatok", () => {
  const NOW = new Date(2026, 11, 10, 12); // dec. 10.
  const offer = (validFrom: string, validTo: string, status = "published") =>
    ({ status, validFrom, validTo }) as never;

  it("állapot az érvényesség alapján (a határnapok is aktívak)", () => {
    expect(offerPhase(offer("2026-12-11", "2026-12-20"), NOW)).toBe("upcoming");
    expect(offerPhase(offer("2026-12-10", "2026-12-20"), NOW)).toBe("active");
    expect(offerPhase(offer("2026-12-01", "2026-12-10"), NOW)).toBe("active");
    expect(offerPhase(offer("2026-12-01", "2026-12-09"), NOW)).toBe("expired");
    expect(offerPhase(offer("2026-12-01", "2026-12-20", "draft"), NOW)).toBe("draft");
    expect(daysLeft({ validTo: "2026-12-13" }, NOW)).toBe(3);
    expect(daysLeft({ validTo: "2026-12-10" }, NOW)).toBe(0);
  });

  it("a záró dátum nem lehet a kezdő előtt", () => {
    expect(offersDef.validate!({ validFrom: "2026-12-10", validTo: "2026-12-01" })).toHaveProperty(
      "validTo"
    );
    expect(offersDef.validate!({ validFrom: "2026-12-10", validTo: "2026-12-10" })).toEqual({});
  });

  it("mintaadat: aktív, hamarosan lejáró, közelgő és lejárt ajánlat, étlap-tételekkel", () => {
    const cfg = defineCrmConfig({ industry: "hospitality", brand: { name: "X" } });
    const data = ensureAddonData(createDemoData(cfg), [menuAddon, offersAddon], cfg, {
      seed: true,
    });
    const menuIds = new Set((data.addons.menu as ContentData).items.map((m) => m.id));
    const offers = (data.addons.offers as ContentData).items;
    const phases = offers.map((o) => offerPhase(o));
    expect(phases).toEqual(expect.arrayContaining(["active", "upcoming", "expired", "draft"]));
    const winter = offers.find((o) => o.title.startsWith("Téli"))!;
    expect((winter.menuItemIds as string[]).length).toBe(3);
    expect((winter.menuItemIds as string[]).every((id) => menuIds.has(id))).toBe(true);
    expect(offersDef.stats!(offers)).toEqual([
      { label: "aktív", value: "1" },
      { label: "hamarosan lejár", value: "1" },
    ]);
  });
});
