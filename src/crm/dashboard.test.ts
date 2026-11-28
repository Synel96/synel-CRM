import { describe, expect, it } from "vitest";
import { defineCrmConfig } from "./config";
import { dashboardSettings, DEFAULT_KPIS, kpiValues, sumField, upcomingDeals } from "./dashboard";
import { createRecord } from "./operations";
import { createDemoData } from "./seed";
import { emptyData, type CrmData } from "./types";

const NOW = new Date(2026, 11, 1, 12); // dec. 1.
const hosp = defineCrmConfig({ industry: "hospitality", brand: { name: "X" } });

function withEvents(): CrmData {
  let data = emptyData();
  const add = (title: string, stageId: string, eventDate: string | null, guests: number | null) => {
    data = createRecord(data, "deals", {
      title,
      value: 100_000,
      stageId,
      contactId: null,
      companyId: null,
      expectedCloseDate: null,
      closedAt: null,
      notes: "",
      custom: { eventDate, guests },
    }).data;
  };
  add("Ma", "deposit", "2026-12-01", 40);
  add("Később", "inquiry", "2026-12-20", 15);
  add("Lemondva", "cancelled", "2026-12-05", 80); // lemondott – nem számít
  add("Túl messze", "inquiry", "2027-02-01", 30);
  add("Elmúlt", "held", "2026-11-20", 25);
  add("Dátum nélkül", "inquiry", null, 10);
  return data;
}

describe("Áttekintés-beállítások profilonként", () => {
  it("általános profil: a klasszikus pipeline-számok", () => {
    const s = dashboardSettings(defineCrmConfig({ brand: { name: "X" } }));
    expect(s.kpis).toEqual(DEFAULT_KPIS);
    expect(s.cards).toEqual(["pipeline", "tasks", "activity"]);
  });

  it("vendéglátás: közelgő rendezvények és vendégszám elöl, közelgő-lista az első kártya", () => {
    const s = dashboardSettings(hosp);
    expect(s.kpis.slice(0, 2)).toEqual(["upcomingDeals", "upcomingSum"]);
    expect(s.cards[0]).toBe("upcomingDeals");
    expect(s.dealDateField).toBe("eventDate");
  });

  it("ingatlaniroda: a bővítmény (ingatlanok) számai kerülnek előre", () => {
    expect(
      dashboardSettings(defineCrmConfig({ industry: "real-estate", brand: { name: "X" } }))
        .addonsFirst
    ).toBe(true);
  });

  it("kikapcsolt modul vagy hiányzó mező esetén az elem kimarad", () => {
    const noDeals = defineCrmConfig({
      industry: "hospitality",
      brand: { name: "X" },
      modules: { deals: false },
    });
    expect(dashboardSettings(noDeals).kpis).toEqual(["overdueTasks"]);
    expect(dashboardSettings(noDeals).cards).toEqual(["tasks", "activity"]);
    const noDate = defineCrmConfig({
      brand: { name: "X" },
      dashboard: { kpis: ["upcomingDeals", "contacts"] },
    });
    expect(dashboardSettings(noDate).kpis).toEqual(["contacts"]);
  });

  it("az ügyfél felülírhatja a profil Áttekintését (kulcsonként)", () => {
    const cfg = defineCrmConfig({
      industry: "hospitality",
      brand: { name: "X" },
      dashboard: { horizonDays: 7 },
    });
    expect(cfg.dashboard).toMatchObject({
      horizonDays: 7,
      dealDateField: "eventDate",
      dealSumField: "guests",
    });
  });
});

describe("közelgő időpontos üzletek", () => {
  it("a következő 30 nap, ma is beleértve; lemondott, elmúlt, dátum nélküli kimarad", () => {
    const list = upcomingDeals(withEvents(), hosp, NOW);
    expect(list.map((d) => d.title)).toEqual(["Ma", "Később"]);
    expect(sumField(list, "guests")).toBe(55);
    expect(upcomingDeals(withEvents(), hosp, NOW, 7).map((d) => d.title)).toEqual(["Ma"]);
  });

  it("KPI-értékek", () => {
    const v = kpiValues(withEvents(), hosp, NOW);
    expect(v.upcomingDeals).toBe(2);
    expect(v.upcomingSum).toBe(55);
  });

  it("a vendéglátós mintaadatban vannak közelgő rendezvények vendégszámmal", () => {
    const v = kpiValues(createDemoData(hosp), hosp);
    expect(v.upcomingDeals).toBeGreaterThan(0);
    expect(v.upcomingSum).toBeGreaterThan(0);
  });

  it("a mintaadat vendégszáma egyezik a rendezvény nevével", () => {
    const wedding = createDemoData(hosp).deals.find((d) => d.title.startsWith("Esküvői"))!;
    expect(wedding.custom.guests).toBe(80);
  });
});
