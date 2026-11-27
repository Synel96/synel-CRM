import { describe, expect, it } from "vitest";
import crmConfig from "@/crm.config";
import realEstate from "@/presets/real-estate";
import { defineCrmConfig } from "./config";
import { fieldsFor, fromFormValues, toFormValues, validate } from "./fields";
import {
  createRecord,
  dashboardStats,
  matchesQuery,
  moveDealToStage,
  pipelineSummary,
  removeRecord,
  taskBucket,
} from "./operations";
import { createDemoData } from "./seed";
import { memoryAdapter, parseCrmData } from "./storage";
import { createCrmStore } from "./store";
import { emptyData } from "./types";

const stages = crmConfig.pipeline;
const NOW = new Date(2026, 10, 15, 12, 0, 0);

describe("crm.config", () => {
  it("a gyári config és az ingatlanos preset is érvényes", () => {
    expect(crmConfig.pipeline.length).toBeGreaterThan(1);
    expect(realEstate.modules.companies).toBe(false);
    expect(realEstate.labels.deals).toBe("Ingatlanok");
  });

  it("hibás configra érthető hibát dob", () => {
    expect(() =>
      defineCrmConfig({
        brand: { name: "X" },
        pipeline: [
          { id: "a", label: "A", probability: 10 },
          { id: "a", label: "B", probability: 20 },
        ],
        customFields: { contact: [{ key: "src", label: "Forrás", type: "select" }] },
      })
    ).toThrow(/customFields\.contact\.0: .*options[\s\S]*pipeline: Ismétlődő stage id/);
  });
});

describe("operations", () => {
  it("cég törlésekor a kapcsolatok és üzletek hivatkozása null lesz, a tevékenységek törlődnek", () => {
    let data = createDemoData(crmConfig, NOW);
    const company = data.companies[0];
    data = createRecord(data, "activities", {
      kind: "note",
      body: "x",
      at: NOW.toISOString(),
      related: { type: "company", id: company.id },
    }).data;

    const next = removeRecord(data, "companies", company.id);

    expect(next.companies.find((c) => c.id === company.id)).toBeUndefined();
    expect(next.contacts.some((c) => c.companyId === company.id)).toBe(false);
    expect(next.deals.some((d) => d.companyId === company.id)).toBe(false);
    expect(next.activities.some((a) => a.related.id === company.id)).toBe(false);
    expect(next.contacts.length).toBe(data.contacts.length);
  });

  it("üzlet törlésekor a kapcsolódó feladat megmarad, de hivatkozás nélkül", () => {
    const data = createDemoData(crmConfig, NOW);
    const task = data.tasks.find((t) => t.related?.type === "deal")!;
    const next = removeRecord(data, "deals", task.related!.id);
    expect(next.tasks.find((t) => t.id === task.id)?.related).toBeNull();
  });

  it("won stage-be mozgatás beállítja, open stage-be visszaállítás törli a closedAt-et", () => {
    let data = createDemoData(crmConfig, NOW);
    const deal = data.deals.find((d) => d.stageId === "lead")!;
    data = moveDealToStage(data, deal.id, "won", stages, NOW);
    expect(data.deals.find((d) => d.id === deal.id)?.closedAt).toBe(NOW.toISOString());
    data = moveDealToStage(data, deal.id, "proposal", stages, NOW);
    expect(data.deals.find((d) => d.id === deal.id)?.closedAt).toBeNull();
    expect(() => moveDealToStage(data, deal.id, "nincs-ilyen", stages)).toThrow();
  });

  it("pipeline összesítés és súlyozott érték", () => {
    let data = emptyData();
    for (const [stageId, value] of [
      ["lead", 1000],
      ["proposal", 2000],
      ["won", 5000],
    ] as const) {
      data = createRecord(data, "deals", {
        title: stageId,
        value,
        stageId,
        contactId: null,
        companyId: null,
        expectedCloseDate: null,
        closedAt: stageId === "won" ? NOW.toISOString() : null,
        notes: "",
      }).data;
    }
    const byStage = Object.fromEntries(pipelineSummary(data, stages).map((s) => [s.stage.id, s]));
    expect(byStage.lead.weighted).toBe(100);
    expect(byStage.proposal.weighted).toBe(1200);

    const stats = dashboardStats(data, stages, NOW);
    expect(stats.openDeals).toBe(2);
    expect(stats.pipelineValue).toBe(3000);
    expect(stats.weightedValue).toBe(1300);
    expect(stats.wonThisMonthValue).toBe(5000);
  });

  it("feladat csoportosítás határidő szerint", () => {
    expect(taskBucket({ done: false, dueDate: "2026-11-14" }, NOW)).toBe("overdue");
    expect(taskBucket({ done: false, dueDate: "2026-11-15" }, NOW)).toBe("today");
    expect(taskBucket({ done: false, dueDate: "2026-11-20" }, NOW)).toBe("upcoming");
    expect(taskBucket({ done: false, dueDate: null }, NOW)).toBe("someday");
    expect(taskBucket({ done: true, dueDate: "2026-11-14" }, NOW)).toBe("done");
  });

  it("ékezet- és kisbetű-független keresés", () => {
    expect(matchesQuery("kovacs", "Kovács Anna")).toBe(true);
    expect(matchesQuery("ANNA", "Kovács Anna")).toBe(true);
    expect(matchesQuery("péter", "Kovács Anna", null)).toBe(false);
    expect(matchesQuery("  ", "bármi")).toBe(true);
  });
});

describe("fields", () => {
  it("egyedi mezők oda-vissza konvertálása", () => {
    const data = createDemoData(realEstate, NOW);
    const fields = fieldsFor("deal", realEstate, data);
    expect(fields.some((f) => f.name === "companyId")).toBe(false); // companies modul ki van kapcsolva

    const values = {
      ...toFormValues({ custom: {} }, fields),
      title: "Panorámás lakás",
      value: "64 900 000",
      stageId: "active",
      "custom.listingType": "Eladó",
      "custom.city": "Budapest",
      "custom.areaSize": "54,5",
      "custom.exclusive": true,
    };
    expect(validate(values, fields)).toEqual({});
    const patch = fromFormValues(values, fields);
    expect(patch).toMatchObject({
      title: "Panorámás lakás",
      value: 64_900_000,
      contactId: null,
      custom: {
        listingType: "Eladó",
        city: "Budapest",
        areaSize: 54.5,
        exclusive: true,
        roomCount: null,
      },
    });
  });

  it("kötelező mezők és hibás szám jelzése", () => {
    const fields = fieldsFor("deal", realEstate, emptyData());
    const errors = validate({ ...toFormValues({ custom: {} }, fields), value: "abc" }, fields);
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(["title", "value", "stageId", "custom.listingType", "custom.city"])
    );
  });

  it("címkék vesszővel elválasztva", () => {
    const fields = fieldsFor("contact", crmConfig, emptyData());
    const tags = fields.find((f) => f.name === "tags")!;
    expect(fromFormValues({ tags: " VIP, Partner ,," }, [tags]).tags).toEqual(["VIP", "Partner"]);
    expect(toFormValues({ tags: ["VIP", "Partner"] }, [tags]).tags).toBe("VIP, Partner");
  });
});

describe("storage és store", () => {
  it("üres tárolónál mintaadattal indul, és a módosítás mentődik", async () => {
    const adapter = memoryAdapter();
    const store = createCrmStore(adapter, () => createDemoData(crmConfig, NOW));
    await store.start();
    expect(store.getState().status).toBe("ready");
    const before = store.getState().data.contacts.length;

    store.create("contacts", {
      firstName: "Teszt",
      lastName: "Elek",
      email: "",
      phone: "",
      jobTitle: "",
      companyId: null,
      tags: [],
      notes: "",
    });
    await Promise.resolve();
    expect((await adapter.load())?.contacts.length).toBe(before + 1);
  });

  it("meglévő adatot nem ír felül mintaadattal", async () => {
    const adapter = memoryAdapter(emptyData());
    const store = createCrmStore(adapter, () => createDemoData(crmConfig, NOW));
    await store.start();
    expect(store.getState().data.contacts).toHaveLength(0);
  });

  it("import: hiányzó gyűjteményeket pótol, ismeretlen formátumot elutasít", () => {
    expect(parseCrmData('{"version":1,"contacts":[]}').deals).toEqual([]);
    expect(() => parseCrmData('{"version":2}')).toThrow();
    expect(() => parseCrmData('{"version":1,"deals":{}}')).toThrow(/deals/);
  });
});
