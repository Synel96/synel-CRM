import { describe, expect, it } from "vitest";
import crmConfig from "@/crm.config";
import blogAddon from "@/modules/blog";
import { blogDef } from "@/modules/blog/def";
import { ensureAddonData } from "./addon-data";
import {
  isLive,
  isScheduled,
  saveContentItem,
  emptyContent,
  type ContentData,
} from "./content/logic";
import { contentFields } from "./content/fields";
import { fromFormValues, toFormValues, toLocalInput } from "./fields";
import {
  imageMarkdown,
  insertBlock,
  markdownImagesMissingAlt,
  prefixLines,
  readingMinutes,
  wordCount,
  wrapSelection,
} from "./markdown";
import { createDemoData } from "./seed";
import { emptyData } from "./types";

describe("Markdown-szerkesztés", () => {
  it("kijelölés körbevétele, üresen mintaszöveggel – a kijelölés a szövegen marad", () => {
    const e = wrapSelection("Ez fontos.", 3, 9, "**", "**", "x");
    expect(e.text).toBe("Ez **fontos**.");
    expect(e.text.slice(e.selStart, e.selEnd)).toBe("fontos");
    const empty = wrapSelection("A ", 2, 2, "_", "_", "dőlt szöveg");
    expect(empty.text).toBe("A _dőlt szöveg_");
    expect(empty.text.slice(empty.selStart, empty.selEnd)).toBe("dőlt szöveg");
    // szóköz a kijelölés szélén: a jelölőn kívülre kerül
    expect(wrapSelection("Első bekezdés", 0, 5, "_", "_", "x").text).toBe("_Első_ bekezdés");
    expect(wrapSelection("a  szó  b", 1, 7, "**", "**", "x").text).toBe("a  **szó**  b");
  });

  it("sor-előtagok: címsor, lista, számozás – és visszakapcsolás", () => {
    const text = "alma\nkörte";
    const list = prefixLines(text, 0, text.length, "-");
    expect(list.text).toBe("- alma\n- körte");
    expect(prefixLines(list.text, 0, list.text.length, "-").text).toBe("alma\nkörte");
    expect(prefixLines(text, 0, text.length, "1.").text).toBe("1. alma\n2. körte");
    // címsor csak a kurzor sorára, és lecseréli a korábbi előtagot
    expect(prefixLines("- elem\nmásik", 2, 2, "##").text).toBe("## elem\nmásik");
  });

  it("kép beszúrása külön bekezdésbe, alt szöveggel", () => {
    const e = insertBlock("Bevezető", 8, imageMarkdown("https://x/y.jpg", "Nappali [felújítva]"));
    expect(e.text).toBe("Bevezető\n\n![Nappali felújítva](https://x/y.jpg)");
  });

  it("szószám, olvasási idő, hiányzó alt a szövegben", () => {
    expect(wordCount("## Cím\n\n**Két** szó és [egy link](https://a.hu) ![kép](u)")).toBe(6);
    expect(readingMinutes("")).toBe(0);
    expect(readingMinutes("szó ".repeat(50))).toBe(1);
    expect(readingMinutes("szó ".repeat(1000))).toBe(5);
    expect(markdownImagesMissingAlt("![](a) ![ ](b) ![jó](c)")).toBe(2);
  });
});

describe("kép-hivatkozások", () => {
  it("https képnél az URL, böngészős tárolásnál rövid hivatkozás, amit az előnézet felold", async () => {
    const { imageRef, resolveImageRefs } = await import("./markdown");
    expect(imageRef({ id: "a1", url: "https://res.cloudinary.com/x.jpg" })).toBe(
      "https://res.cloudinary.com/x.jpg"
    );
    expect(imageRef({ id: "a1", url: "data:image/jpeg;base64,AAAA" })).toBe("crm-image:a1");
    const md = "![Iroda](crm-image:a1) és ![Más](crm-image:nincs)";
    expect(resolveImageRefs(md, [{ id: "a1", url: "data:x" }])).toBe(
      "![Iroda](data:x) és ![Más](crm-image:nincs)"
    );
  });
});

describe("időzítés", () => {
  const NOW = new Date("2026-06-01T12:00:00Z");
  it("időzített vs. élő vs. vázlat", () => {
    expect(isScheduled({ status: "published", publishedAt: "2026-06-02T00:00:00Z" }, NOW)).toBe(
      true
    );
    expect(isLive({ status: "published", publishedAt: "2026-06-02T00:00:00Z" }, NOW)).toBe(false);
    expect(isLive({ status: "published", publishedAt: "2026-05-01T00:00:00Z" }, NOW)).toBe(true);
    expect(isLive({ status: "draft", publishedAt: null }, NOW)).toBe(false);
  });

  it("kifejezetten megadott megjelenési idő felülírja az automatikusat", () => {
    const at = "2026-12-24T08:00:00.000Z";
    const res = saveContentItem(
      emptyContent(),
      { title: "Karácsony", status: "published", publishedAt: at },
      null,
      { hasPage: true },
      NOW
    );
    expect(res.item.publishedAt).toBe(at);
    const auto = saveContentItem(
      emptyContent(),
      { title: "Most", status: "published" },
      null,
      { hasPage: true },
      NOW
    );
    expect(auto.item.publishedAt).toBe(NOW.toISOString());
  });

  it("datetime-local mező oda-vissza (helyi idő ↔ ISO)", () => {
    const field = { name: "publishedAt", label: "x", type: "datetime" as const, required: false };
    const iso = fromFormValues({ publishedAt: "2026-12-24T09:30" }, [field]).publishedAt as string;
    expect(new Date(iso).getHours()).toBe(9);
    expect(toLocalInput(iso)).toBe("2026-12-24T09:30");
    expect(toFormValues({ publishedAt: null }, [field]).publishedAt).toBe("");
    expect(fromFormValues({ publishedAt: "" }, [field]).publishedAt).toBeNull();
  });
});

describe("blog bővítmény", () => {
  it("űrlap: kivonat, Markdown-tartalom (kötelező), címkék, szerző, megjelenés + SEO", () => {
    const item = { images: [{ id: "1", url: "https://x/a.jpg", alt: "Iroda", caption: "" }] };
    const fields = contentFields(blogDef, crmConfig, emptyData(), item as never);
    const body = fields.find((f) => f.name === "body")!;
    expect(body).toMatchObject({ type: "markdown", required: true });
    expect(body.images).toEqual([{ id: "1", url: "https://x/a.jpg", alt: "Iroda" }]);
    expect(fields.map((f) => f.name)).toEqual(
      expect.arrayContaining(["excerpt", "tags", "author", "publishedAt", "slug", "seoTitle"])
    );
  });

  it("mentéskor kiszámolja az olvasási időt", () => {
    expect(blogDef.transform!({ body: "szó ".repeat(600) }).readingTime).toBe(3);
  });

  it("mintaadat: publikált, időzített és vázlat bejegyzés, egyedi slugokkal", () => {
    const data = ensureAddonData(createDemoData(crmConfig), [blogAddon], crmConfig, { seed: true });
    const posts = (data.addons.blog as ContentData).items;
    expect(posts.some((p) => isLive(p))).toBe(true);
    expect(posts.some((p) => isScheduled(p))).toBe(true);
    expect(posts.some((p) => p.status === "draft")).toBe(true);
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
    expect(blogDef.stats!(posts)).toEqual([{ label: "időzítve", value: "1" }]);
  });
});
