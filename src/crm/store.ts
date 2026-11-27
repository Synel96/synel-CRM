import { useSyncExternalStore } from "react";
import crmConfig from "@/crm.config";
import { createDemoData } from "./seed";
import * as ops from "./operations";
import { localStorageAdapter, type StorageAdapter } from "./storage";
import { emptyData, type Collection, type CrmData, type Id, type NewRecord } from "./types";

type State = { status: "loading" | "ready" | "error"; data: CrmData; error?: string };

export function createCrmStore(adapter: StorageAdapter, seed: () => CrmData | null) {
  let state: State = { status: "loading", data: emptyData() };
  const listeners = new Set<() => void>();
  let started = false;

  const emit = () => listeners.forEach((l) => l());
  const set = (next: State) => {
    state = next;
    emit();
  };

  const commit = (data: CrmData) => {
    set({ status: "ready", data });
    adapter.save(data).catch((err) => {
      console.error("CRM mentés sikertelen", err);
      set({ ...state, error: "A mentés nem sikerült" });
    });
  };

  async function start() {
    if (started) return;
    started = true;
    try {
      const loaded = await adapter.load();
      const data = loaded ?? seed() ?? emptyData();
      if (!loaded) await adapter.save(data);
      set({ status: "ready", data });
    } catch (err) {
      set({ status: "error", data: emptyData(), error: String(err) });
    }
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      void start();
      return () => listeners.delete(listener);
    },
    getState: () => state,
    start,

    create<C extends Collection>(collection: C, input: NewRecord<C>) {
      const res = ops.createRecord(state.data, collection, input);
      commit(res.data);
      return res.record;
    },
    update<C extends Collection>(collection: C, id: Id, patch: Partial<NewRecord<C>>) {
      commit(ops.updateRecord(state.data, collection, id, patch));
    },
    remove(collection: Collection, id: Id) {
      commit(ops.removeRecord(state.data, collection, id));
    },
    moveDeal(dealId: Id, stageId: string) {
      commit(ops.moveDealToStage(state.data, dealId, stageId, crmConfig.pipeline));
    },
    replaceAll(data: CrmData) {
      commit(data);
    },
    async resetToDemo() {
      commit(createDemoData(crmConfig));
    },
    async clearAll() {
      commit(emptyData());
    },
  };
}

export type CrmStore = ReturnType<typeof createCrmStore>;

let instance: CrmStore | null = null;

/** Az alkalmazás egyetlen store-példánya (CSR – csak böngészőben fut). */
export function getCrmStore(): CrmStore {
  if (!instance) {
    instance = createCrmStore(localStorageAdapter(crmConfig.storageKey), () =>
      crmConfig.seedDemoData ? createDemoData(crmConfig) : null
    );
  }
  return instance;
}

export function useCrm() {
  const store = getCrmStore();
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  return { ...state, store };
}
