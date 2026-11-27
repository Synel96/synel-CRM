import { useSyncExternalStore } from "react";
import crmConfig from "@/crm.config";
import { activeAddons } from "./addon-registry";
import { applyCoreRemove, ensureAddonData } from "./addon-data";
import type { CrmAddon } from "./addons";
import type { CrmConfig } from "./config";
import { createDemoData } from "./seed";
import * as ops from "./operations";
import { localStorageAdapter, type StorageAdapter } from "./storage";
import { emptyData, type Collection, type CrmData, type Id, type NewRecord } from "./types";

type State = { status: "loading" | "ready" | "error"; data: CrmData; error?: string };

type StoreOptions = {
  config: CrmConfig;
  addons: CrmAddon[];
  /** Üres tárolónál mintaadatokkal induljon-e. */
  seedDemoData: boolean;
};

export function createCrmStore(adapter: StorageAdapter, options: StoreOptions) {
  const { config, addons } = options;
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

  const demoData = () => ensureAddonData(createDemoData(config), addons, config, { seed: true });

  async function start() {
    if (started) return;
    started = true;
    try {
      const loaded = await adapter.load();
      const data = loaded
        ? // Utólag bekapcsolt bővítmény: demó módban mintaadatot kap, egyébként üresen indul.
          ensureAddonData(loaded, addons, config, { seed: options.seedDemoData })
        : options.seedDemoData
          ? demoData()
          : ensureAddonData(emptyData(), addons, config, { seed: false });
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
      commit(applyCoreRemove(ops.removeRecord(state.data, collection, id), addons, collection, id));
    },
    moveDeal(dealId: Id, stageId: string) {
      commit(ops.moveDealToStage(state.data, dealId, stageId, config.pipeline));
    },

    /** Bővítmény adatának olvasása (a bővítmény saját hook-ja csomagolja). */
    addonData<D>(addonId: string): D {
      return state.data.addons[addonId] as D;
    },
    /**
     * Bővítmény adatának módosítása tiszta függvénnyel. A függvény a mag
     * adatait is módosíthatja (pl. tevékenységek takarítása törléskor).
     */
    updateAddon<D>(addonId: string, fn: (data: D, core: CrmData) => D | [D, CrmData]) {
      const result = fn(state.data.addons[addonId] as D, state.data);
      const [addonData, core] = Array.isArray(result) ? result : [result, state.data];
      commit({ ...core, addons: { ...core.addons, [addonId]: addonData } });
    },

    replaceAll(data: CrmData) {
      commit(ensureAddonData(data, addons, config, { seed: false }));
    },
    async resetToDemo() {
      commit(demoData());
    },
    async clearAll() {
      commit(ensureAddonData(emptyData(), addons, config, { seed: false }));
    },
  };
}

export type CrmStore = ReturnType<typeof createCrmStore>;

let instance: CrmStore | null = null;

/** Az alkalmazás egyetlen store-példánya (CSR – csak böngészőben fut). */
export function getCrmStore(): CrmStore {
  if (!instance) {
    instance = createCrmStore(localStorageAdapter(crmConfig.storageKey), {
      config: crmConfig,
      addons: activeAddons(),
      seedDemoData: crmConfig.seedDemoData,
    });
  }
  return instance;
}

export function useCrm() {
  const store = getCrmStore();
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  return { ...state, store };
}
