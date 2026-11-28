/*
 * Vélemények – a tartalomtípus leírása (mezők, oszlopok, mintaadat).
 * Bekapcsolás: crm.config.ts → addons: [..., "testimonials"]
 * Egy vélemény köthető egy kapcsolathoz és (ha be van kapcsolva) egy
 * szolgáltatáshoz; a kapcsolat adatlapján megjelennek a véleményei.
 */
import { MessageSquareQuoteIcon } from "lucide-react";
import crmConfig from "@/crm.config";
import type { ContentData, ContentItem } from "@/src/crm/content/logic";
import type { ContentTypeDef } from "@/src/crm/content/types";
import { formatDate } from "@/src/crm/i18n";
import { contactName } from "@/src/crm/operations";
import type { CrmData } from "@/src/crm/types";
import { Stars } from "./components/Stars";

const hu = crmConfig.locale === "hu";
export const L = hu
  ? {
      plural: "Vélemények",
      singular: "vélemény",
      title: "Név",
      role: "Cég / beosztás",
      rating: "Értékelés",
      text: "Vélemény szövege",
      date: "Dátum",
      source: "Forrás",
      sourceUrl: "Link az eredetihez",
      contact: "Kapcsolat a CRM-ben",
      service: "Kapcsolódó szolgáltatás",
      average: "átlag",
      panel: "Vélemények",
      add: "Új vélemény",
      sources: ["Google", "Facebook", "Saját oldal", "E-mail", "Egyéb"],
    }
  : {
      plural: "Testimonials",
      singular: "testimonial",
      title: "Name",
      role: "Company / role",
      rating: "Rating",
      text: "Testimonial",
      date: "Date",
      source: "Source",
      sourceUrl: "Link to original",
      contact: "Contact in CRM",
      service: "Related service",
      average: "avg",
      panel: "Testimonials",
      add: "New testimonial",
      sources: ["Google", "Facebook", "Website", "Email", "Other"],
    };

export const rating = (i: ContentItem) => (typeof i.rating === "number" ? i.rating : 0);

function serviceOptions(core: CrmData) {
  const services = core.addons.services as ContentData | undefined;
  return (services?.items ?? []).map((s) => ({ value: s.id, label: s.title }));
}

export const testimonialsDef: ContentTypeDef = {
  addonId: "testimonials",
  entity: "testimonial",
  icon: MessageSquareQuoteIcon,
  labels: () => ({ plural: L.plural, singular: L.singular, title: L.title }),
  hasPage: false,
  maxImages: 1,
  defaults: () => ({ rating: 5, date: new Date().toISOString().slice(0, 10) }),
  fields: (core) => {
    const services = serviceOptions(core);
    return [
      { name: "authorRole", label: L.role, type: "text", required: false },
      {
        name: "rating",
        label: L.rating,
        type: "select",
        required: true,
        options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: "★".repeat(n) })),
      },
      { name: "text", label: L.text, type: "textarea", required: true, wide: true },
      { name: "date", label: L.date, type: "date", required: false },
      {
        name: "source",
        label: L.source,
        type: "relation",
        required: false,
        options: L.sources.map((s) => ({ value: s, label: s })),
      },
      { name: "sourceUrl", label: L.sourceUrl, type: "url", required: false, wide: true },
      {
        name: "contactId",
        label: L.contact,
        type: "relation",
        required: false,
        options: core.contacts
          .map((c) => ({ value: c.id, label: contactName(c, crmConfig.locale) }))
          .sort((a, b) => a.label.localeCompare(b.label, crmConfig.locale)),
      },
      ...(services.length
        ? [
            {
              name: "serviceId",
              label: L.service,
              type: "relation" as const,
              required: false,
              options: services,
            },
          ]
        : []),
    ];
  },
  // A select szöveget ad vissza – az értékelés számként tárolódik.
  transform: (patch) => ({ ...patch, rating: Number(patch.rating) || 5 }),
  columns: () => [
    { key: "rating", header: L.rating, cell: (i) => <Stars value={rating(i)} /> },
    { key: "source", header: L.source, hideOnMobile: true, cell: (i) => String(i.source ?? "—") },
    {
      key: "date",
      header: L.date,
      hideOnMobile: true,
      cell: (i) => formatDate(typeof i.date === "string" ? i.date : null),
    },
  ],
  preview: (i) => String(i.text ?? ""),
  stats: (items) => {
    const rated = items.filter((i) => i.status === "published" && rating(i) > 0);
    if (!rated.length) return [];
    const avg = rated.reduce((s, i) => s + rating(i), 0) / rated.length;
    return [
      {
        label: L.average,
        value: `${avg.toLocaleString(crmConfig.locale, { maximumFractionDigits: 1 })} ★`,
      },
    ];
  },
  onCoreRemove: (items, collection, id) =>
    collection === "contacts"
      ? items.map((i) => (i.contactId === id ? { ...i, contactId: null } : i))
      : items,
  seed: (core) => {
    const services = serviceOptions(core);
    const c = (n: number) => core.contacts[n % Math.max(1, core.contacts.length)];
    const person = (n: number) => (c(n) ? contactName(c(n), crmConfig.locale) : "Ügyfél");
    return [
      {
        title: person(0),
        authorRole: c(0)?.jobTitle ?? "",
        rating: 5,
        text: hu
          ? "Gyors, precíz munka. Az új oldal óta kétszer annyi ajánlatkérés érkezik."
          : "Fast and precise. Twice as many inquiries since the new site.",
        date: "2026-10-12",
        source: "Google",
        contactId: c(0)?.id ?? null,
        serviceId: services[0]?.value ?? null,
        status: "published",
        featured: true,
      },
      {
        title: person(1),
        authorRole: c(1)?.jobTitle ?? "",
        rating: 5,
        text: hu
          ? "A CRM pont a mi folyamatainkra lett szabva, a csapat egy hét alatt átállt."
          : "The CRM fits our processes; the team switched in a week.",
        date: "2026-09-03",
        source: "E-mail",
        contactId: c(1)?.id ?? null,
        serviceId: services[2]?.value ?? null,
        status: "published",
      },
      {
        title: person(2),
        authorRole: c(2)?.jobTitle ?? "",
        rating: 4,
        text: hu
          ? "Jó kommunikáció, határidőre kész. A webshop azóta is hibátlanul fut."
          : "Good communication, on time.",
        date: "2026-08-21",
        source: "Facebook",
        contactId: c(2)?.id ?? null,
        serviceId: services[1]?.value ?? null,
        status: "draft",
      },
    ];
  },
};
