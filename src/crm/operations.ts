/*
 * Tiszta (side-effect mentes) adatműveletek. A store ezekkel módosítja az
 * állapotot, így egy későbbi backend is ugyanazt a logikát használhatja,
 * és minden szabály unit-tesztelhető.
 */
import type { Stage } from "./config";
import type { Collection, CrmData, Id, NewRecord, RecordOf, RelatedRef } from "./types";

export function newId(): Id {
  return globalThis.crypto.randomUUID();
}

export function createRecord<C extends Collection>(
  data: CrmData,
  collection: C,
  input: NewRecord<C>,
  now = new Date()
): { data: CrmData; record: RecordOf<C> } {
  const ts = now.toISOString();
  const record = {
    ...input,
    custom: input.custom ?? {},
    id: newId(),
    createdAt: ts,
    updatedAt: ts,
  } as unknown as RecordOf<C>;
  const list = data[collection] as RecordOf<C>[];
  return { data: { ...data, [collection]: [record, ...list] }, record };
}

export function updateRecord<C extends Collection>(
  data: CrmData,
  collection: C,
  id: Id,
  patch: Partial<NewRecord<C>>,
  now = new Date()
): CrmData {
  const list = data[collection] as RecordOf<C>[];
  if (!list.some((r) => r.id === id)) throw new Error(`${collection}/${id} nem található`);
  return {
    ...data,
    [collection]: list.map((r) =>
      r.id === id ? { ...r, ...patch, id: r.id, updatedAt: now.toISOString() } : r
    ),
  };
}

const RELATED_TYPE: Partial<Record<Collection, RelatedRef["type"]>> = {
  contacts: "contact",
  companies: "company",
  deals: "deal",
};

/**
 * Törlés kapcsolatok kezelésével:
 * - cég törlésekor a kapcsolatok/üzletek companyId-je null lesz,
 * - kapcsolat törlésekor az üzletek contactId-je null lesz,
 * - a törölt rekordhoz tartozó tevékenységek törlődnek,
 * - a feladatok megmaradnak, csak a hivatkozásuk szűnik meg.
 */
export function removeRecord(data: CrmData, collection: Collection, id: Id): CrmData {
  const next: CrmData = {
    ...data,
    [collection]: (data[collection] as { id: Id }[]).filter((r) => r.id !== id),
  };
  if (collection === "companies") {
    next.contacts = next.contacts.map((c) => (c.companyId === id ? { ...c, companyId: null } : c));
    next.deals = next.deals.map((d) => (d.companyId === id ? { ...d, companyId: null } : d));
  }
  if (collection === "contacts") {
    next.deals = next.deals.map((d) => (d.contactId === id ? { ...d, contactId: null } : d));
  }
  const relType = RELATED_TYPE[collection];
  if (relType) {
    const matches = (ref: RelatedRef | null) => ref?.type === relType && ref.id === id;
    next.activities = next.activities.filter((a) => !matches(a.related));
    next.tasks = next.tasks.map((t) => (matches(t.related) ? { ...t, related: null } : t));
  }
  return next;
}

/** Stage-váltás: won/lost stage-be lépéskor beállítja a closedAt-et. */
export function moveDealToStage(
  data: CrmData,
  dealId: Id,
  stageId: string,
  stages: Stage[],
  now = new Date()
): CrmData {
  const stage = stages.find((s) => s.id === stageId);
  if (!stage) throw new Error(`Ismeretlen stage: ${stageId}`);
  const closedAt = stage.kind === "open" ? null : now.toISOString();
  return updateRecord(data, "deals", dealId, { stageId, closedAt }, now);
}

export type StageSummary = { stage: Stage; count: number; total: number; weighted: number };

export function pipelineSummary(data: CrmData, stages: Stage[]): StageSummary[] {
  return stages.map((stage) => {
    const deals = data.deals.filter((d) => d.stageId === stage.id);
    const total = deals.reduce((sum, d) => sum + d.value, 0);
    return { stage, count: deals.length, total, weighted: (total * stage.probability) / 100 };
  });
}

export function dashboardStats(data: CrmData, stages: Stage[], now = new Date()) {
  const kindOf = new Map(stages.map((s) => [s.id, s.kind]));
  const open = data.deals.filter((d) => kindOf.get(d.stageId) === "open");
  const summary = pipelineSummary(data, stages).filter((s) => s.stage.kind === "open");
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const wonThisMonth = data.deals.filter(
    (d) => kindOf.get(d.stageId) === "won" && d.closedAt !== null && d.closedAt >= monthStart
  );
  const today = toDateKey(now);
  return {
    contacts: data.contacts.length,
    openDeals: open.length,
    pipelineValue: summary.reduce((s, x) => s + x.total, 0),
    weightedValue: summary.reduce((s, x) => s + x.weighted, 0),
    wonThisMonthValue: wonThisMonth.reduce((s, d) => s + d.value, 0),
    wonThisMonthCount: wonThisMonth.length,
    overdueTasks: data.tasks.filter((t) => !t.done && t.dueDate !== null && t.dueDate < today)
      .length,
  };
}

export type TaskBucket = "overdue" | "today" | "upcoming" | "someday" | "done";

export function taskBucket(task: { done: boolean; dueDate: string | null }, now = new Date()) {
  if (task.done) return "done" as const;
  if (task.dueDate === null) return "someday" as const;
  const today = toDateKey(now);
  if (task.dueDate < today) return "overdue" as const;
  if (task.dueDate === today) return "today" as const;
  return "upcoming" as const;
}

/** Helyi idő szerinti YYYY-MM-DD. */
export function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Ékezet- és kisbetű-független keresés több mezőben. */
export function matchesQuery(query: string, ...values: (string | null | undefined)[]) {
  const q = normalize(query.trim());
  if (!q) return true;
  return values.some((v) => v && normalize(v).includes(q));
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function contactName(c: { firstName: string; lastName: string }, locale: string) {
  // Magyarul a vezetéknév áll elöl.
  return (locale === "hu" ? `${c.lastName} ${c.firstName}` : `${c.firstName} ${c.lastName}`).trim();
}
