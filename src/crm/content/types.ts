import type { LucideIcon } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type { Column } from "@/components/crm/DataTable";
import type { FormField } from "../fields";
import type { Collection, CrmData, Id } from "../types";
import type { ContentItem } from "./logic";

/**
 * Egy tartalomtípus leírása. Ebből a `defineContentAddon()` teljes
 * bővítményt készít: menüpont, lista, szerkesztő, áttekintő kártya.
 */
export interface ContentTypeDef {
  /** Bővítmény-azonosító és URL is: pl. "services" → /services */
  addonId: string;
  /** Egyedi mezők kulcsa a configban és a hivatkozások típusa, pl. "service". */
  entity: string;
  icon: LucideIcon;
  labels: () => {
    /** Menüpont és oldalcím, pl. „Szolgáltatások”. */
    plural: string;
    /** pl. „szolgáltatás” – az „Új …” gombhoz és panelcímhez. */
    singular: string;
    /** A cím mező felirata, pl. „Név” vagy „Cím”. */
    title: string;
  };
  /** Van-e saját aloldala a weboldalon (slug + SEO mezők). */
  hasPage: boolean;
  /** Legfeljebb ennyi kép (0 = nincs képkezelés). */
  maxImages: number;
  /** A típus saját űrlapmezői (a cím után, a közös mezők előtt). */
  fields: (core: CrmData) => FormField[];
  /** Új elem kezdőértékei. */
  defaults?: () => Record<string, unknown>;
  /** Mentés előtti átalakítás (pl. szövegből szám). */
  transform?: (patch: Record<string, unknown>) => Record<string, unknown>;
  /** Plusz oszlopok a listában (a cím után). */
  columns?: (core: CrmData) => Column<ContentItem>[];
  /** Plusz sorok az áttekintő kártyán, pl. átlagos értékelés. */
  stats?: (items: ContentItem[]) => { label: string; value: string }[];
  /** Mintaadatok (a mag és a korábbi bővítmények adataira hivatkozhat). */
  seed?: (core: CrmData) => (Partial<ContentItem> & { title: string })[];
  /** Mag-rekord (pl. kapcsolat) törlésekor a hivatkozások takarítása. */
  onCoreRemove?: (items: ContentItem[], collection: Collection, id: Id) => ContentItem[];
  /** Plusz tartalom a szerkesztőpanel alján (meglévő elemnél). */
  Extra?: ComponentType<{ item: ContentItem }>;
  /** Panel a kapcsolat szerkesztőjében. */
  ContactPanel?: ComponentType<{ contactId: Id }>;
  /** Rövid előnézet a lista első oszlopában a cím alatt. */
  preview?: (item: ContentItem) => ReactNode;
}
