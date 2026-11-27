export type Id = string;

export type CustomValue = string | number | boolean | null;
export type CustomValues = Record<string, CustomValue>;

export interface BaseRecord {
  id: Id;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  /** A crm.config `customFields` szerinti egyedi mezők értékei. */
  custom: CustomValues;
}

export interface Contact extends BaseRecord {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyId: Id | null;
  tags: string[];
  notes: string;
}

export interface Company extends BaseRecord {
  name: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  notes: string;
}

export interface Deal extends BaseRecord {
  title: string;
  value: number;
  stageId: string;
  contactId: Id | null;
  companyId: Id | null;
  expectedCloseDate: string | null; // YYYY-MM-DD
  /** Mikor került won/lost stage-be (riportokhoz). */
  closedAt: string | null;
  notes: string;
}

export type TaskPriority = "low" | "normal" | "high";

export type CoreRelatedType = "contact" | "company" | "deal";

/** Bővítmények saját típust is használhatnak (pl. "property"). */
export type RelatedRef = { type: CoreRelatedType | (string & {}); id: Id };

export interface Task extends BaseRecord {
  title: string;
  dueDate: string | null; // YYYY-MM-DD
  done: boolean;
  priority: TaskPriority;
  related: RelatedRef | null;
  notes: string;
}

export type ActivityKind = "note" | "call" | "email" | "meeting";

export interface Activity extends BaseRecord {
  kind: ActivityKind;
  body: string;
  at: string; // ISO
  related: RelatedRef;
}

export interface CrmData {
  version: 1;
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  tasks: Task[];
  activities: Activity[];
  /** Bővítmények adatai, a bővítmény id-ja szerint (lásd src/crm/addons.ts). */
  addons: Record<string, unknown>;
}

export type Collection = Exclude<keyof CrmData, "version" | "addons">;

export type RecordOf<C extends Collection> = CrmData[C][number];

/** Létrehozáskor a rendszer tölti: id, createdAt, updatedAt. */
export type NewRecord<C extends Collection> = Omit<RecordOf<C>, keyof BaseRecord> & {
  custom?: CustomValues;
};

export const emptyData = (): CrmData => ({
  version: 1,
  contacts: [],
  companies: [],
  deals: [],
  tasks: [],
  activities: [],
  addons: {},
});
