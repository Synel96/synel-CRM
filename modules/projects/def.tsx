/*
 * Projektek (referenciák) – a tartalomtípus leírása. Galéria (borító + képek
 * alt szöveggel), Markdown-leírás képbeszúrással, ügyfél/cég/kapcsolat,
 * év, kategória, technológiák, élő link, kapcsolódó szolgáltatások.
 */
import { FolderKanbanIcon } from "lucide-react";
import crmConfig from "@/crm.config";
import { Badge } from "@/components/ui/badge";
import { contentOptions } from "@/src/crm/content/fields";
import type { ContentItem } from "@/src/crm/content/logic";
import type { ContentTypeDef } from "@/src/crm/content/types";
import { altOf, imageUrl } from "@/src/crm/media";
import { contactName } from "@/src/crm/operations";
import type { CrmData } from "@/src/crm/types";

const hu = crmConfig.locale === "hu";
export const L = hu
  ? {
      plural: "Projektek",
      singular: "projekt",
      title: "Cím",
      client: "Ügyfél neve",
      clientHint: "Ahogy a weboldalon megjelenjen, pl. „Alpha Dent fogászat”",
      company: "Cég a CRM-ben",
      contact: "Kapcsolattartó a CRM-ben",
      year: "Év",
      category: "Kategória",
      categoryHint: "pl. Weboldal, Webshop, Arculat",
      tech: "Technológiák",
      techHint: "Vesszővel elválasztva, pl. React, Vike, Tailwind",
      short: "Rövid leírás",
      shortHelp:
        "1–2 mondat a projektlistába és a kártyákra: mi volt a feladat és mi lett az eredmény. A részletes esettanulmány a „Leírás” mezőbe kerül.",
      body: "Leírás (esettanulmány)",
      liveUrl: "Élő oldal",
      liveUrlHelp:
        "Az elkészült munka nyilvános címe. A weboldalon „Megnézem” gombként jelenhet meg. Csak akkor add meg, ha az ügyfél hozzájárult a megjelenítéshez.",
      services: "Kapcsolódó szolgáltatások",
      images: "Galéria",
      featured: "kiemelt",
      testimonials: "Vélemények ehhez a projekthez",
      none: "Még nincs hozzá kapcsolt vélemény.",
      panel: "Projektjei",
    }
  : {
      plural: "Projects",
      singular: "project",
      title: "Title",
      client: "Client name",
      clientHint: "As shown on the website",
      company: "Company in CRM",
      contact: "Contact in CRM",
      year: "Year",
      category: "Category",
      categoryHint: "e.g. Website, Webshop, Branding",
      tech: "Technologies",
      techHint: "Comma separated",
      short: "Short description",
      shortHelp: "1–2 sentences for lists and cards.",
      body: "Description (case study)",
      liveUrl: "Live site",
      liveUrlHelp: "Public URL of the finished work (only with the client's consent).",
      services: "Related services",
      images: "Gallery",
      featured: "featured",
      testimonials: "Testimonials for this project",
      none: "No testimonials linked yet.",
      panel: "Projects",
    };

const list = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

function relationOptions(core: CrmData) {
  return {
    companies: core.companies
      .map((c) => ({ value: c.id, label: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label, crmConfig.locale)),
    contacts: core.contacts
      .map((c) => ({ value: c.id, label: contactName(c, crmConfig.locale) }))
      .sort((a, b) => a.label.localeCompare(b.label, crmConfig.locale)),
  };
}

export const projectsDef: ContentTypeDef = {
  addonId: "projects",
  entity: "project",
  icon: FolderKanbanIcon,
  labels: () => ({ plural: L.plural, singular: L.singular, title: L.title }),
  hasPage: true,
  maxImages: 20,
  defaults: () => ({ year: new Date().getFullYear() }),
  fields: (core, item) => {
    const { companies, contacts } = relationOptions(core);
    const services = contentOptions(core, "services");
    return [
      { name: "client", label: L.client, type: "text", required: false, hint: L.clientHint },
      { name: "year", label: L.year, type: "number", required: false, nullable: true },
      ...(crmConfig.modules.companies
        ? [
            {
              name: "companyId",
              label: L.company,
              type: "relation" as const,
              required: false,
              options: companies,
            },
          ]
        : []),
      { name: "contactId", label: L.contact, type: "relation", required: false, options: contacts },
      { name: "category", label: L.category, type: "text", required: false, hint: L.categoryHint },
      { name: "technologies", label: L.tech, type: "tags", required: false, hint: L.techHint },
      {
        name: "shortDescription",
        label: L.short,
        type: "textarea",
        required: false,
        wide: true,
        help: L.shortHelp,
      },
      {
        name: "body",
        label: L.body,
        type: "markdown",
        required: false,
        wide: true,
        images: (item?.images ?? []).map((img) => ({ id: img.id, url: img.url, alt: altOf(img) })),
      },
      {
        name: "liveUrl",
        label: L.liveUrl,
        type: "url",
        required: false,
        wide: true,
        help: L.liveUrlHelp,
      },
      ...(services.length
        ? [
            {
              name: "serviceIds",
              label: L.services,
              type: "tags" as const,
              required: false,
              optionsOnly: true,
              wide: true,
              options: services,
            },
          ]
        : []),
    ];
  },
  columns: () => [
    {
      key: "cover",
      header: "",
      className: "w-16",
      hideOnMobile: true,
      cell: (i) => {
        const cover = i.images[0];
        return cover ? (
          <img
            src={imageUrl(cover.url, { width: 96, height: 64 })}
            alt={altOf(cover, i.title)}
            className="h-10 w-14 rounded object-cover"
          />
        ) : (
          <span className="bg-muted block h-10 w-14 rounded" aria-hidden />
        );
      },
    },
    { key: "client", header: L.client, hideOnMobile: true, cell: (i) => String(i.client || "—") },
    { key: "year", header: L.year, hideOnMobile: true, cell: (i) => String(i.year ?? "—") },
    {
      key: "category",
      header: L.category,
      hideOnMobile: true,
      cell: (i) => (i.category ? <Badge variant="accent">{String(i.category)}</Badge> : "—"),
    },
  ],
  preview: (i) => String(i.shortDescription ?? ""),
  stats: (items) => {
    const n = items.filter((i) => i.featured).length;
    return n ? [{ label: L.featured, value: String(n) }] : [];
  },
  onCoreRemove: (items, collection, id) => {
    if (collection === "contacts")
      return items.map((i) => (i.contactId === id ? { ...i, contactId: null } : i));
    if (collection === "companies")
      return items.map((i) => (i.companyId === id ? { ...i, companyId: null } : i));
    return items;
  },
  seed: (core) => {
    const services = contentOptions(core, "services");
    const c = (n: number) => core.contacts[n % Math.max(1, core.contacts.length)];
    const company = (n: number) => core.companies.find((x) => x.id === c(n)?.companyId);
    const svc = (...idx: number[]) =>
      idx.map((i) => services[i]?.value).filter(Boolean) as string[];
    return hu
      ? [
          {
            title: "Fogászati rendelő weboldala online időpontfoglalással",
            client: company(0)?.name ?? "Fogászat",
            companyId: company(0)?.id ?? null,
            contactId: c(0)?.id ?? null,
            year: 2026,
            category: "Weboldal",
            technologies: ["Vike", "React", "Tailwind"],
            shortDescription:
              "Új, gyors weboldal online foglalással – a telefonos bejelentkezések fele átkerült online.",
            body: `## A feladat

A régi oldal lassú volt, és mobilon szinte használhatatlan.

## A megoldás

- egyedi dizájn a rendelő arculatához
- **online időpontfoglalás**
- SEO-alapok és Google Cégprofil

## Az eredmény

Három hónap alatt **kétszeresére** nőtt az online foglalások száma.`,
            liveUrl: "https://example.com",
            serviceIds: svc(0),
            status: "published",
            featured: true,
          },
          {
            title: "Kézműves pékség webshopja",
            client: company(1)?.name ?? "Pékség",
            companyId: company(1)?.id ?? null,
            contactId: c(1)?.id ?? null,
            year: 2025,
            category: "Webshop",
            technologies: ["React", "Stripe"],
            shortDescription:
              "Előrendelés és helyszíni átvétel – a hétvégi rendelések harmada online érkezik.",
            body: "## A feladat\n\nElőrendelési rendszer a hétvégi kenyerekre.",
            serviceIds: svc(1),
            status: "published",
          },
          {
            title: "Ingatlaniroda CRM-bevezetése",
            client: company(2)?.name ?? "Ingatlaniroda",
            companyId: company(2)?.id ?? null,
            contactId: c(2)?.id ?? null,
            year: 2026,
            category: "CRM",
            technologies: ["Synel CRM"],
            shortDescription: "Ingatlanok, érdeklődők és párosítás egy helyen.",
            body: "",
            serviceIds: svc(2),
            status: "draft",
          },
        ]
      : [
          {
            title: "Dental clinic website with online booking",
            client: "Dental clinic",
            year: 2026,
            category: "Website",
            technologies: ["React"],
            shortDescription: "New fast website with online booking.",
            status: "published",
          },
        ];
  },
};

/** A projekt technológiái és szolgáltatás-azonosítói listaként. */
export const projectTech = (i: ContentItem) => list(i.technologies);
export const projectServiceIds = (i: ContentItem) => list(i.serviceIds);
