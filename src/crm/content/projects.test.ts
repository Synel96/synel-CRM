import { describe, expect, it } from "vitest";
import crmConfig from "@/crm.config";
import projectsAddon from "@/modules/projects";
import { projectsDef } from "@/modules/projects/def";
import servicesAddon from "@/modules/services";
import testimonialsAddon from "@/modules/testimonials";
import { testimonialsDef } from "@/modules/testimonials/def";
import { ensureAddonData } from "../addon-data";
import { createDemoData } from "../seed";
import { memoryAdapter } from "../storage";
import { createCrmStore } from "../store";
import { emptyData } from "../types";
import { contentFields, contentOptions } from "./fields";
import type { ContentData } from "./logic";

const addons = [servicesAddon, projectsAddon, testimonialsAddon];

describe("projektek", () => {
  it("űrlap: galéria-képek beszúrhatók a Markdown-leírásba, szolgáltatások választhatók", () => {
    const data = ensureAddonData(createDemoData(crmConfig), addons, crmConfig, { seed: true });
    const item = { images: [{ id: "i1", url: "https://x/c.jpg", alt: "Borító", caption: "" }] };
    const fields = contentFields(projectsDef, crmConfig, data, item as never);
    expect(fields.find((f) => f.name === "body")).toMatchObject({
      type: "markdown",
      images: [{ id: "i1", url: "https://x/c.jpg", alt: "Borító" }],
    });
    const services = fields.find((f) => f.name === "serviceIds")!;
    expect(services).toMatchObject({ type: "tags", optionsOnly: true });
    expect(services.options!.length).toBeGreaterThan(0);
    expect(fields.find((f) => f.name === "liveUrl")?.help).toBeTruthy();
  });

  it("szolgáltatások nélkül nincs szolgáltatás-mező", () => {
    const names = contentFields(projectsDef, crmConfig, emptyData()).map((f) => f.name);
    expect(names).not.toContain("serviceIds");
    expect(contentOptions(emptyData(), "services")).toEqual([]);
  });

  it("mintaadat: projektek szolgáltatásra, a vélemény projektre hivatkozik", () => {
    const data = ensureAddonData(createDemoData(crmConfig), addons, crmConfig, { seed: true });
    const services = new Set((data.addons.services as ContentData).items.map((s) => s.id));
    const projects = (data.addons.projects as ContentData).items;
    expect(projects.length).toBe(3);
    expect(projects.every((p) => (p.serviceIds as string[]).every((id) => services.has(id)))).toBe(
      true
    );
    const projectIds = new Set(projects.map((p) => p.id));
    const testimonials = (data.addons.testimonials as ContentData).items;
    expect(testimonials.some((t) => projectIds.has(String(t.projectId)))).toBe(true);
  });

  it("vélemény űrlapján csak akkor van projekt-mező, ha vannak projektek", () => {
    const withProjects = ensureAddonData(createDemoData(crmConfig), addons, crmConfig, {
      seed: true,
    });
    expect(
      contentFields(testimonialsDef, crmConfig, withProjects).some((f) => f.name === "projectId")
    ).toBe(true);
    expect(
      contentFields(testimonialsDef, crmConfig, emptyData()).some((f) => f.name === "projectId")
    ).toBe(false);
  });

  it("cég vagy kapcsolat törlésekor a projekt megmarad, csak a hivatkozás szűnik meg", async () => {
    const store = createCrmStore(memoryAdapter(), {
      config: crmConfig,
      addons,
      seedDemoData: true,
    });
    await store.start();
    const projects = () => (store.getState().data.addons.projects as ContentData).items;
    const p = projects().find((x) => x.companyId && x.contactId)!;
    store.remove("companies", String(p.companyId));
    store.remove("contacts", String(p.contactId));
    expect(projects().find((x) => x.id === p.id)).toMatchObject({
      companyId: null,
      contactId: null,
      title: p.title,
    });
  });

  it("a menüben a Tartalomkezelés alatt, a registry sorrendjében", async () => {
    const { buildNav } = await import("../nav");
    const content = buildNav(crmConfig, addons).find((s) => s.id === "content")!;
    expect(content.items.map((i) => i.href)).toEqual(["/services", "/projects", "/testimonials"]);
  });
});
