/*
 * Közös tartalommotor – tiszta logika (unit-tesztelt). A tartalmi
 * bővítmények (szolgáltatások, vélemények, projektek, blog, galéria) mind
 * erre épülnek: publikálás, slug, sorrend, kiemelés, képek.
 */
import type { MediaImage } from "../media";
import { detachRelated, newId } from "../operations";
import type { BaseRecord, CrmData, Id } from "../types";

export type ContentStatus = "draft" | "published";

export interface ContentItem extends BaseRecord {
  title: string;
  status: ContentStatus;
  /** Első publikálás ideje (ISO); vázlatnál null. */
  publishedAt: string | null;
  /** URL-részlet a weboldalon (csak saját aloldallal rendelkező típusnál). */
  slug: string;
  /** Megjelenítési sorrend (kisebb = előrébb). */
  sortOrder: number;
  featured: boolean;
  images: MediaImage[];
  seoTitle: string;
  seoDescription: string;
  /** A típus saját mezői (pl. ár, értékelés). */
  [field: string]: unknown;
}

export interface ContentData {
  items: ContentItem[];
}

export const emptyContent = (): ContentData => ({ items: [] });

export type ContentInput = Partial<Omit<ContentItem, keyof BaseRecord>> & {
  title: string;
  custom?: BaseRecord["custom"];
};

/** URL-barát slug magyar ékezetekkel is: „Árvíztűrő tükör” → „arvizturo-tukor”. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Egyedi slug a típuson belül: foglaltnál „-2”, „-3” … utótag. */
export function uniqueSlug(base: string, items: ContentItem[], selfId?: Id): string {
  const root = base || "tartalom";
  const taken = new Set(items.filter((i) => i.id !== selfId).map((i) => i.slug));
  if (!taken.has(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export function validateSlug(slug: string, items: ContentItem[], selfId?: Id) {
  if (!SLUG_PATTERN.test(slug)) return "format" as const;
  if (items.some((i) => i.slug === slug && i.id !== selfId)) return "taken" as const;
  return null;
}

export const sortedItems = (items: ContentItem[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));

/**
 * Mentés (új vagy meglévő). Kezeli: slug (üresnél a címből, egyedivé téve),
 * publikálás dátuma (első publikáláskor beáll, vázlatra visszaállítva törlődik),
 * új elem a lista végére kerül.
 */
export function saveContentItem(
  data: ContentData,
  input: ContentInput,
  id: Id | null,
  { hasPage }: { hasPage: boolean },
  now = new Date()
): { data: ContentData; item: ContentItem } {
  const ts = now.toISOString();
  const existing = id ? data.items.find((i) => i.id === id) : undefined;
  if (id && !existing) throw new Error(`Tartalom nem található: ${id}`);

  const merged = { ...existing, ...input } as ContentItem;
  const status: ContentStatus = merged.status === "published" ? "published" : "draft";
  // Az URL stabil: meglévő elemnél csak akkor változik, ha kifejezetten új
  // slugot adnak meg (a cím módosítása nem töri el a weboldalon a linket).
  const requested = String(input.slug ?? "").trim();
  const slug = hasPage
    ? uniqueSlug(slugify(requested || existing?.slug || merged.title), data.items, id ?? undefined)
    : "";
  const publishedAt =
    status === "published" ? (existing?.publishedAt ?? merged.publishedAt ?? ts) : null;

  const item: ContentItem = {
    ...merged,
    // Hiányzó közös mezők pótlása (pl. új elemnél).
    images: merged.images ?? [],
    seoTitle: merged.seoTitle ?? "",
    seoDescription: merged.seoDescription ?? "",
    featured: merged.featured ?? false,
    custom: { ...existing?.custom, ...input.custom },
    status,
    slug,
    publishedAt,
    sortOrder: existing?.sortOrder ?? Math.max(0, ...data.items.map((i) => i.sortOrder + 1)),
    id: existing?.id ?? newId(),
    createdAt: existing?.createdAt ?? ts,
    updatedAt: ts,
  };
  return {
    item,
    data: {
      items: existing
        ? data.items.map((i) => (i.id === item.id ? item : i))
        : [...data.items, item],
    },
  };
}

/** Gyors publikálás / visszavonás a listából (a slug változatlan marad). */
export function setStatus(
  data: ContentData,
  id: Id,
  status: ContentStatus,
  now = new Date()
): ContentData {
  const ts = now.toISOString();
  return {
    items: data.items.map((i) =>
      i.id === id
        ? {
            ...i,
            status,
            publishedAt: status === "published" ? (i.publishedAt ?? ts) : null,
            updatedAt: ts,
          }
        : i
    ),
  };
}

/** Elem mozgatása a sorrendben egy hellyel előre/hátra. */
export function moveItem(data: ContentData, id: Id, dir: -1 | 1): ContentData {
  const list = sortedItems(data.items);
  const i = list.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return data;
  [list[i], list[j]] = [list[j], list[i]];
  const order = new Map(list.map((x, idx) => [x.id, idx]));
  return { items: data.items.map((x) => ({ ...x, sortOrder: order.get(x.id)! })) };
}

/** Törlés + a hozzá tartozó tevékenységek/feladat-hivatkozások takarítása. */
export function removeContentItem(
  data: ContentData,
  core: CrmData,
  relatedType: string,
  id: Id
): [ContentData, CrmData] {
  return [
    { items: data.items.filter((i) => i.id !== id) },
    detachRelated(core, { type: relatedType, id }),
  ];
}

/** Betöltött adat normalizálása: hiányzó közös mezők pótlása. */
export function normalizeContent(raw: unknown): ContentData {
  const v = (raw ?? {}) as Partial<ContentData>;
  const items = Array.isArray(v.items) ? v.items : [];
  return {
    items: items.map((i, idx) => ({
      ...i,
      status: i.status === "published" ? "published" : "draft",
      publishedAt: i.publishedAt ?? null,
      slug: typeof i.slug === "string" ? i.slug : "",
      sortOrder: typeof i.sortOrder === "number" ? i.sortOrder : idx,
      featured: Boolean(i.featured),
      images: Array.isArray(i.images) ? i.images : [],
      seoTitle: i.seoTitle ?? "",
      seoDescription: i.seoDescription ?? "",
      custom: i.custom ?? {},
    })),
  };
}

export function contentCounts(data: ContentData) {
  const published = data.items.filter((i) => i.status === "published").length;
  return { total: data.items.length, published, drafts: data.items.length - published };
}
