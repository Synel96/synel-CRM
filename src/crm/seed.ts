import type { CrmConfig, CustomFieldDef } from "./config";
import { industryOf } from "./industries";
import { createRecord, toDateKey } from "./operations";
import { emptyData, type CrmData, type CustomValues } from "./types";

/*
 * Mintaadatok bemutatóhoz. Bármilyen crm.config-gal működik: az üzleteket
 * az aktuális pipeline stage-ei között osztja szét, az egyedi select
 * mezőket pedig a config opcióiból tölti ki.
 */

const COMPANIES = [
  { name: "Duna Logisztika Kft.", industry: "Logisztika", website: "https://dunalog.example" },
  { name: "Balaton Tech Zrt.", industry: "IT", website: "https://balatontech.example" },
  { name: "Tisza Építő Kft.", industry: "Építőipar", website: "https://tiszaepito.example" },
  { name: "Mátra Food Bt.", industry: "Élelmiszer", website: "https://matrafood.example" },
];

const PEOPLE = [
  ["Anna", "Kovács", "Ügyvezető"],
  ["Péter", "Nagy", "Beszerzési vezető"],
  ["Eszter", "Szabó", "Marketingvezető"],
  ["Gábor", "Tóth", "CTO"],
  ["Réka", "Horváth", "Pénzügyi vezető"],
  ["Bence", "Varga", "Projektmenedzser"],
  ["Lilla", "Kiss", "Irodavezető"],
  ["Dávid", "Molnár", "Tulajdonos"],
] as const;

/**
 * Mintaértékek az egyedi mezőkhöz: select → az opciók sorban, boolean →
 * váltakozva, szám → 12, 18, 24…, dátum → a következő hetekre szórva (pl.
 * rendezvény dátuma), így az időpont-alapú Áttekintés is mutat valamit.
 */
function demoCustomValues(fields: CustomFieldDef[], i: number, now = new Date()): CustomValues {
  const out: CustomValues = {};
  for (const f of fields) {
    if (f.type === "select" && f.options?.length) out[f.key] = f.options[i % f.options.length];
    else if (f.type === "boolean") out[f.key] = i % 2 === 0;
    else if (f.type === "number") out[f.key] = 12 + i * 6;
    else if (f.type === "date") {
      const d = new Date(now);
      d.setDate(d.getDate() + 3 + i * 5);
      out[f.key] = toDateKey(d);
    }
  }
  return out;
}

export function createDemoData(config: CrmConfig, now = new Date()): CrmData {
  let data = emptyData();
  const day = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d;
  };

  const companyIds = COMPANIES.map((c, i) => {
    const res = createRecord(data, "companies", {
      ...c,
      email: `info@${new URL(c.website).hostname}`,
      phone: `+36 1 555 01${i}0`,
      address: ["Budapest", "Siófok", "Szeged", "Eger"][i],
      notes: "",
      custom: demoCustomValues(config.customFields.company, i),
    });
    data = res.data;
    return res.record.id;
  });

  const contactIds = PEOPLE.map(([firstName, lastName, jobTitle], i) => {
    const res = createRecord(data, "contacts", {
      firstName,
      lastName,
      jobTitle,
      email: `${firstName}.${lastName}@example.com`
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, ""),
      phone: `+36 30 555 ${String(1000 + i * 137).slice(0, 4)}`,
      companyId: companyIds[i % companyIds.length],
      tags: config.contactTags.length ? [config.contactTags[i % config.contactTags.length]] : [],
      notes: "",
      custom: demoCustomValues(config.customFields.contact, i),
    });
    data = res.data;
    return res.record.id;
  });

  const stages = config.pipeline;
  // Az üzletek és feladatok szövege az üzlettípus-profilból jön (src/crm/industries.ts).
  const demo = industryOf(config.industry).demo;
  const dealIds = demo.deals.map(([title, value, demoCustom], i) => {
    const stage = stages[i % stages.length];
    const res = createRecord(data, "deals", {
      title,
      value,
      stageId: stage.id,
      contactId: contactIds[i % contactIds.length],
      companyId: companyIds[i % companyIds.length],
      expectedCloseDate: toDateKey(day(7 * (i + 1))),
      closedAt: stage.kind === "open" ? null : day(-i).toISOString(),
      notes: "",
      custom: { ...demoCustomValues(config.customFields.deal, i, now), ...demoCustom },
    });
    data = res.data;
    return res.record.id;
  });

  const schedule = [
    [-2, "high"],
    [0, "normal"],
    [1, "high"],
    [4, "normal"],
    [null, "low"],
  ] as const;
  demo.tasks.slice(0, schedule.length).forEach((title, i) => {
    const [offset, priority] = schedule[i];
    data = createRecord(data, "tasks", {
      title,
      dueDate: offset === null ? null : toDateKey(day(offset)),
      done: false,
      priority,
      related: { type: "deal", id: dealIds[i] },
      notes: "",
      custom: demoCustomValues(config.customFields.task, i),
    }).data;
  });

  const kinds = ["call", "email", "meeting", "note"] as const;
  const bodies = demo.activities ?? [
    "Bemutatkozó hívás, érdeklődik az éves csomag iránt.",
    "Elküldtem az árajánlatot PDF-ben.",
    "Személyes egyeztetés az irodában, döntés jövő héten.",
    "Költségkeret: kb. 2,5 M Ft, Q1-ben szeretnének indulni.",
  ];
  const activities = kinds.map((kind, i) => [kind, bodies[i], i] as const);
  activities.forEach(([kind, body, i]) => {
    data = createRecord(data, "activities", {
      kind,
      body,
      at: day(-i - 1).toISOString(),
      related: { type: "contact", id: contactIds[i] },
    }).data;
  });

  return data;
}
