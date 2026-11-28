import { describe, expect, it } from "vitest";
import crmConfig from "@/crm.config";
import servicesAddon from "@/modules/services";
import { formatServicePrice, servicesDef } from "@/modules/services";
import testimonialsAddon from "@/modules/testimonials";
import { testimonialsDef } from "@/modules/testimonials/def";
import { ensureAddonData } from "../addon-data";
import { fromFormValues, toFormValues, validate } from "../fields";
import { createRecord } from "../operations";
import { createDemoData } from "../seed";
import { memoryAdapter } from "../storage";
import { createCrmStore } from "../store";
import { emptyData } from "../types";
import { contentFields } from "./fields";
import {
  contentCounts,
  emptyContent,
  moveItem,
  normalizeContent,
  removeContentItem,
  saveContentItem,
  setStatus,
  slugify,
  sortedItems,
  uniqueSlug,
  validateSlug,
  type ContentData,
} from "./logic";

const T0 = new Date("2026-01-01T10:00:00Z");
const T1 = new Date("2026-02-01T10:00:00Z");
const T2 = new Date("2026-03-01T10:00:00Z");

describe("slug", () => {
  it("magyar ékezetekkel, írásjelekkel is URL-barát", () => {
    expect(slugify("Árvíztűrő tükörfúrógép")).toBe("arvizturo-tukorfurogep");
    expect(slugify("  Weboldal-készítés & SEO!  ")).toBe("weboldal-keszites-seo");
    expect(slugify("Ő, Ű, ö, ü")).toBe("o-u-o-u");
    expect(slugify("x".repeat(100))).toHaveLength(80);
  });

  it("egyedi a típuson belül, és ellenőrizhető", () => {
    const data = saveContentItem(emptyContent(), { title: "Webshop" }, null, {
      hasPage: true,
    }).data;
    expect(uniqueSlug("webshop", data.items)).toBe("webshop-2");
    expect(uniqueSlug("webshop", data.items, data.items[0].id)).toBe("webshop");
    expect(validateSlug("webshop", data.items)).toBe("taken");
    expect(validateSlug("Nem Jó", data.items)).toBe("format");
    expect(validateSlug("jo-slug-2", data.items)).toBeNull();
  });
});

describe("mentés, publikálás, sorrend", () => {
  it("címből slug, a cím módosítása nem változtatja az URL-t", () => {
    let res = saveContentItem(
      emptyContent(),
      { title: "CRM-bevezetés" },
      null,
      { hasPage: true },
      T0
    );
    expect(res.item.slug).toBe("crm-bevezetes");
    res = saveContentItem(
      res.data,
      { title: "CRM bevezetés cégeknek" },
      res.item.id,
      { hasPage: true },
      T1
    );
    expect(res.item.slug).toBe("crm-bevezetes");
    const second = saveContentItem(
      res.data,
      { title: "CRM-bevezetés" },
      null,
      { hasPage: true },
      T1
    );
    expect(second.item.slug).toBe("crm-bevezetes-2");
  });

  it("aloldal nélküli típusnál nincs slug", () => {
    expect(
      saveContentItem(emptyContent(), { title: "Anna" }, null, { hasPage: false }).item.slug
    ).toBe("");
  });

  it("publikálás dátuma: első publikáláskor beáll, megmarad, vázlatnál törlődik", () => {
    let res = saveContentItem(
      emptyContent(),
      { title: "A", status: "draft" },
      null,
      { hasPage: false },
      T0
    );
    expect(res.item.publishedAt).toBeNull();
    let data = setStatus(res.data, res.item.id, "published", T1);
    expect(data.items[0].publishedAt).toBe(T1.toISOString());
    res = saveContentItem(
      data,
      { title: "A2", status: "published" },
      res.item.id,
      { hasPage: false },
      T2
    );
    expect(res.item.publishedAt).toBe(T1.toISOString());
    data = setStatus(res.data, res.item.id, "draft", T2);
    expect(data.items[0]).toMatchObject({ status: "draft", publishedAt: null });
  });

  it("új elem a végére kerül, és mozgatható", () => {
    let data: ContentData = emptyContent();
    for (const title of ["A", "B", "C"]) {
      data = saveContentItem(data, { title }, null, { hasPage: false }).data;
    }
    expect(sortedItems(data.items).map((i) => i.title)).toEqual(["A", "B", "C"]);
    const c = data.items.find((i) => i.title === "C")!;
    data = moveItem(data, c.id, -1);
    expect(sortedItems(data.items).map((i) => i.title)).toEqual(["A", "C", "B"]);
    const a = data.items.find((i) => i.title === "A")!;
    expect(moveItem(data, a.id, -1)).toBe(data); // a lista elején nem mozdul
  });

  it("törléskor a tevékenységek törlődnek, a feladat hivatkozás nélkül marad", () => {
    const { data, item } = saveContentItem(emptyContent(), { title: "X" }, null, {
      hasPage: false,
    });
    let core = createRecord(emptyData(), "activities", {
      kind: "note",
      body: "jegyzet",
      at: "",
      related: { type: "service", id: item.id },
    }).data;
    core = createRecord(core, "tasks", {
      title: "Kép cseréje",
      dueDate: null,
      done: false,
      priority: "normal",
      related: { type: "service", id: item.id },
      notes: "",
    }).data;
    const [next, nextCore] = removeContentItem(data, core, "service", item.id);
    expect(next.items).toHaveLength(0);
    expect(nextCore.activities).toHaveLength(0);
    expect(nextCore.tasks[0].related).toBeNull();
  });

  it("hiányos mentett adat normalizálása és számlálás", () => {
    const data = normalizeContent({
      items: [
        { id: "1", title: "A", status: "published" },
        { id: "2", title: "B" },
      ],
    });
    expect(data.items[1]).toMatchObject({
      status: "draft",
      images: [],
      slug: "",
      sortOrder: 1,
      featured: false,
    });
    expect(contentCounts(data)).toEqual({ total: 2, published: 1, drafts: 1 });
    expect(normalizeContent(undefined)).toEqual(emptyContent());
  });
});

describe("szolgáltatások", () => {
  it("ár megjelenítése megjegyzéssel", () => {
    const item = (priceFrom: unknown, priceNote: unknown) =>
      ({ priceFrom, priceNote }) as unknown as Parameters<typeof formatServicePrice>[0];
    expect(formatServicePrice(item(350_000, "-tól"))).toMatch(/^350\s000\sFt-tól$/);
    expect(formatServicePrice(item(15_000, "/hó"))).toMatch(/Ft\/hó$/);
    expect(formatServicePrice(item(null, "egyedi árajánlat"))).toBe("egyedi árajánlat");
    expect(formatServicePrice(item(null, ""))).toBe("");
  });

  it("űrlap: cím + saját mezők + közös mezők (slug, SEO)", () => {
    const names = contentFields(servicesDef, crmConfig, emptyData()).map((f) => f.name);
    expect(names.slice(0, 2)).toEqual(["title", "shortDescription"]);
    expect(names).toEqual(
      expect.arrayContaining(["priceFrom", "status", "featured", "slug", "seoTitle"])
    );
    // Az URL és a SEO mezőknél „?” súgó magyarázza, mire valók.
    const fields = contentFields(servicesDef, crmConfig, emptyData());
    for (const name of ["slug", "seoTitle", "seoDescription"]) {
      expect(fields.find((f) => f.name === name)?.help, name).toBeTruthy();
    }
  });
});

describe("vélemények", () => {
  it("nincs slug/SEO, az értékelés számként tárolódik, a szöveg kötelező", () => {
    const fields = contentFields(testimonialsDef, crmConfig, emptyData());
    expect(fields.some((f) => f.name === "slug")).toBe(false);
    const values = { ...toFormValues({ custom: {}, rating: 5 }, fields), title: "Kiss Anna" };
    expect(Object.keys(validate(values, fields))).toContain("text");
    const patch = testimonialsDef.transform!(
      fromFormValues({ ...values, rating: "4", text: "Szuper" }, fields)
    );
    expect(patch.rating).toBe(4);
  });

  it("átlagos értékelés csak a publikáltakból", () => {
    const items = normalizeContent({
      items: [
        { id: "1", title: "A", status: "published", rating: 5 },
        { id: "2", title: "B", status: "published", rating: 4 },
        { id: "3", title: "C", status: "draft", rating: 1 },
      ],
    }).items;
    expect(testimonialsDef.stats!(items)[0].value).toMatch(/^4[,.]5 ★$/);
  });
});

describe("integráció a store-ral", () => {
  const addons = [servicesAddon, testimonialsAddon];

  it("mintaadat: a vélemények kapcsolatra és szolgáltatásra hivatkoznak", () => {
    const data = ensureAddonData(createDemoData(crmConfig), addons, crmConfig, { seed: true });
    const services = data.addons.services as ContentData;
    const testimonials = data.addons.testimonials as ContentData;
    expect(services.items.length).toBeGreaterThan(0);
    expect(services.items.every((s) => s.slug)).toBe(true);
    const ids = new Set(services.items.map((s) => s.id));
    expect(testimonials.items.some((t) => ids.has(String(t.serviceId)))).toBe(true);
    expect(testimonials.items.every((t) => typeof t.rating === "number")).toBe(true);
  });

  it("kapcsolat törlésekor a vélemény megmarad, de hivatkozás nélkül", async () => {
    const store = createCrmStore(memoryAdapter(), {
      config: crmConfig,
      addons,
      seedDemoData: true,
    });
    await store.start();
    const t = () => store.getState().data.addons.testimonials as ContentData;
    const linked = t().items.find((i) => i.contactId)!;
    store.remove("contacts", String(linked.contactId));
    const after = t().items.find((i) => i.id === linked.id)!;
    expect(after.contactId).toBeNull();
    expect(after.text).toBe(linked.text);
  });

  it("a menüben a Tartalomkezelés csoportba kerülnek, hivatkozásnévvel", async () => {
    const { buildNav } = await import("../nav");
    const content = buildNav(crmConfig, addons).find((s) => s.id === "content")!;
    expect(content.items.map((i) => i.href)).toEqual(["/services", "/testimonials"]);
    const data = { items: [{ id: "x", title: "Webshop" }] };
    expect(servicesAddon.relatedLabel!(data, { type: "service", id: "x" })).toBe("Webshop");
    expect(servicesAddon.relatedLabel!(data, { type: "deal", id: "x" })).toBeUndefined();
  });
});
