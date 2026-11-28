/*
 * Markdown segédfüggvények a szerkesztőhöz (tiszta, unit-tesztelt), és a
 * biztonságos HTML-előnézet (lustán betöltve, hogy a többi oldalt ne
 * terhelje).
 */

export type Edit = { text: string; selStart: number; selEnd: number };

/** Kijelölés körbevétele, pl. **félkövér**; üres kijelölésnél mintaszöveggel. */
export function wrapSelection(
  text: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder: string
): Edit {
  // A kijelölés széleiről a szóközök a jelölőn kívülre kerülnek: „**szó** ”,
  // nem „**szó **” – utóbbit a Markdown nem formázza.
  const raw = text.slice(start, end);
  const lead = raw.length - raw.trimStart().length;
  const trail = raw.length - raw.trimEnd().length;
  const inner = raw.trim();
  const s = inner ? start + lead : start;
  const e = inner ? end - trail : end;
  const selected = inner || placeholder;
  const next = text.slice(0, s) + before + selected + after + text.slice(e);
  return {
    text: next,
    selStart: s + before.length,
    selEnd: s + before.length + selected.length,
  };
}

/**
 * A kijelölt sorok elé előtag (címsor, lista, idézet). `"1."` esetén
 * számozott lista. Ha már mindegyik sor így kezdődik, leveszi (kapcsoló).
 */
export function prefixLines(text: string, start: number, end: number, prefix: string): Edit {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const nl = text.indexOf("\n", end);
  const lineEnd = nl === -1 ? text.length : nl;
  const lines = text.slice(lineStart, lineEnd).split("\n");
  const numbered = prefix === "1.";
  const pattern = numbered
    ? /^\d+\.\s/
    : new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s`);
  const allHave = lines.every((l) => pattern.test(l));
  const changed = lines
    .map((l, i) => {
      if (allHave) return l.replace(pattern, "");
      const clean = l.replace(/^(#{1,6}|>|-|\d+\.)\s/, "");
      return `${numbered ? `${i + 1}.` : prefix} ${clean}`;
    })
    .join("\n");
  const next = text.slice(0, lineStart) + changed + text.slice(lineEnd);
  return { text: next, selStart: lineStart, selEnd: lineStart + changed.length };
}

/** Szöveg beszúrása a kurzorhoz, saját sorba (pl. kép). */
export function insertBlock(text: string, at: number, block: string): Edit {
  const before = text.slice(0, at);
  const after = text.slice(at);
  const pre = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
  const post = after && !after.startsWith("\n") ? "\n\n" : "";
  const next = before + pre + block + post + after;
  const pos = before.length + pre.length + block.length;
  return { text: next, selStart: pos, selEnd: pos };
}

/** Kép Markdownja; a szögletes zárójel a leírásban nem törheti el a szintaxist. */
export const imageMarkdown = (url: string, alt: string) =>
  `![${alt.replace(/[[\]]/g, "")}](${url})`;

/**
 * Beszúráskor használt kép-hivatkozás. Valódi (https) URL-nél maga az URL;
 * böngészős (demó) tárolásnál a több száz KB-os data: URL helyett egy rövid
 * `crm-image:<id>` hivatkozás, amit az előnézet (és később az API) feloldja.
 */
export const imageRef = (img: { id: string; url: string }) =>
  img.url.startsWith("data:") ? `crm-image:${img.id}` : img.url;

/** `crm-image:<id>` hivatkozások cseréje a kép valódi URL-jére. */
export function resolveImageRefs(md: string, images: { id: string; url: string }[]): string {
  const byId = new Map(images.map((i) => [i.id, i.url]));
  return md.replace(/\(crm-image:([\w-]+)\)/g, (all, id: string) =>
    byId.has(id) ? `(${byId.get(id)})` : all
  );
}

/** Szavak száma (Markdown-jelölők nélkül). */
export function wordCount(md: string): number {
  const plain = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ");
  return plain.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Olvasási idő percben (kb. 200 szó/perc, legalább 1 perc, ha van szöveg). */
export function readingMinutes(md: string): number {
  const words = wordCount(md);
  return words === 0 ? 0 : Math.max(1, Math.round(words / 200));
}

/** Hány beszúrt képnél hiányzik az alt szöveg: ![](url) vagy ![  ](url). */
export function markdownImagesMissingAlt(md: string): number {
  return [...md.matchAll(/!\[([^\]]*)\]\(/g)].filter((m) => !m[1].trim()).length;
}

/**
 * Markdown → biztonságos HTML az előnézethez. A marked és a DOMPurify csak
 * itt, első használatkor töltődik be. A DOMPurify kiszűr minden szkriptet és
 * eseménykezelőt (pl. <img onerror>), így a beírt HTML sem futhat le.
 */
export async function renderMarkdown(
  md: string,
  images: { id: string; url: string }[] = []
): Promise<string> {
  const [{ marked }, { default: DOMPurify }] = await Promise.all([
    import("marked"),
    import("dompurify"),
  ]);
  const html = await marked.parse(resolveImageRefs(md, images), { gfm: true, breaks: false });
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
