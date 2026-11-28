import { describe, expect, it } from "vitest";
import crmConfig from "@/crm.config";
import galleryAddon from "@/modules/gallery";
import { albumMissingAlt, galleryDef, MAX_ALBUM_IMAGES } from "@/modules/gallery/def";
import projectsAddon from "@/modules/projects";
import servicesAddon from "@/modules/services";
import { ensureAddonData } from "../addon-data";
import { createDemoData } from "../seed";
import { emptyData } from "../types";
import { contentFields } from "./fields";
import { normalizeContent, type ContentData } from "./logic";

const img = (id: string, alt?: string) => ({ id, url: `https://x/${id}.jpg`, caption: "", alt });

describe("galéria", () => {
  it("albumonként legfeljebb 100 kép, saját URL és SEO", () => {
    expect(galleryDef.maxImages).toBe(MAX_ALBUM_IMAGES);
    expect(galleryDef.hasPage).toBe(true);
    const names = contentFields(galleryDef, crmConfig, emptyData()).map((f) => f.name);
    expect(names).toEqual(
      expect.arrayContaining(["description", "category", "date", "slug", "seoTitle"])
    );
    expect(names).not.toContain("projectId"); // projektek nélkül nincs projekt-mező
  });

  it("a kategória mező mellett súgó magyarázza az egységes írásmódot", () => {
    expect(
      contentFields(galleryDef, crmConfig, emptyData()).find((f) => f.name === "category")?.help
    ).toBeTruthy();
  });

  it("összesítő: képek száma és hiányzó alt szövegek", () => {
    const albums = normalizeContent({
      items: [
        { id: "a", title: "A", images: [img("1", "Torta"), img("2"), img("3", " ")] },
        { id: "b", title: "B", images: [img("4", "Iroda")] },
      ],
    }).items;
    expect(albumMissingAlt(albums[0])).toBe(2);
    expect(galleryDef.stats!(albums)).toEqual([
      { label: "kép", value: "4" },
      { label: "alt hiányzik", value: "2" },
    ]);
    expect(galleryDef.stats!(albums.slice(1))).toEqual([{ label: "kép", value: "1" }]);
  });

  it("mintaadat: album projekthez kötve, ha van projekt", () => {
    const data = ensureAddonData(
      createDemoData(crmConfig),
      [servicesAddon, projectsAddon, galleryAddon],
      crmConfig,
      { seed: true }
    );
    const projectIds = new Set((data.addons.projects as ContentData).items.map((p) => p.id));
    const albums = (data.addons.gallery as ContentData).items;
    expect(albums.length).toBe(3);
    expect(albums.some((a) => projectIds.has(String(a.projectId)))).toBe(true);
    expect(new Set(albums.map((a) => a.slug)).size).toBe(3);
  });

  it("a Tartalomkezelés csoport végén jelenik meg", async () => {
    const { buildNav } = await import("../nav");
    const content = buildNav(crmConfig, [servicesAddon, projectsAddon, galleryAddon]).find(
      (s) => s.id === "content"
    )!;
    expect(content.items.at(-1)!.href).toBe("/gallery");
  });
});
