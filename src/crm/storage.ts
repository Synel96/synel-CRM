import { emptyData, type CrmData } from "./types";

/*
 * Adattároló-adapter. Most böngészős localStorage-ot használunk; ha egy
 * ügyfélnek backend kell, elég egy új adaptert írni (pl. REST/Supabase),
 * ami ezt az interfészt valósítja meg, és a `store.ts`-ben lecserélni.
 */
export interface StorageAdapter {
  load(): Promise<CrmData | null>;
  save(data: CrmData): Promise<void>;
  clear(): Promise<void>;
}

export function localStorageAdapter(key: string): StorageAdapter {
  return {
    async load() {
      try {
        const raw = localStorage.getItem(key);
        return raw ? parseCrmData(raw) : null;
      } catch (err) {
        console.error("CRM adatok betöltése sikertelen", err);
        return null;
      }
    },
    async save(data) {
      localStorage.setItem(key, JSON.stringify(data));
    },
    async clear() {
      localStorage.removeItem(key);
    },
  };
}

export function memoryAdapter(initial: CrmData | null = null): StorageAdapter {
  let stored = initial ? structuredClone(initial) : null;
  return {
    async load() {
      return stored ? structuredClone(stored) : null;
    },
    async save(data) {
      stored = structuredClone(data);
    },
    async clear() {
      stored = null;
    },
  };
}

/** JSON import/export-hoz és betöltéshez: hiányzó gyűjteményeket pótol. */
export function parseCrmData(raw: string): CrmData {
  const value = JSON.parse(raw) as Partial<CrmData>;
  if (typeof value !== "object" || value === null || value.version !== 1) {
    throw new Error("Ismeretlen adatformátum (version: 1 szükséges)");
  }
  const base = emptyData();
  for (const key of ["contacts", "companies", "deals", "tasks", "activities"] as const) {
    if (value[key] !== undefined && !Array.isArray(value[key])) {
      throw new Error(`Hibás mező: ${key}`);
    }
  }
  return { ...base, ...value, version: 1 } as CrmData;
}
