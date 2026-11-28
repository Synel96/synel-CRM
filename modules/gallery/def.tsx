/*
 * Galéria – albumok a közös tartalommotorra. Egy album: cím, leírás,
 * kategória, dátum, opcionális kapcsolódó projekt, és legfeljebb 100 kép
 * (az első a borító), mindegyik alt szöveggel és képaláírással.
 */
import { ImagesIcon } from "lucide-react";
import crmConfig from "@/crm.config";
import { Badge } from "@/components/ui/badge";
import { contentOptions } from "@/src/crm/content/fields";
import type { ContentItem } from "@/src/crm/content/logic";
import type { ContentTypeDef } from "@/src/crm/content/types";
import { formatDate } from "@/src/crm/i18n";
import { altOf, imageUrl, missingAltCount } from "@/src/crm/media";

const hu = crmConfig.locale === "hu";
export const L = hu
  ? {
      plural: "Galéria",
      singular: "album",
      title: "Album címe",
      description: "Leírás",
      descriptionHint: "Rövid bevezető az album fölé (nem kötelező)",
      category: "Kategória",
      categoryHint: "pl. Esküvői torták, Irodabelső, Rendezvény",
      categoryHelp:
        "A weboldalon a kategóriák szerint szűrhetők az albumok (pl. „Esküvői torták”, „Születésnapi torták”). Mindig ugyanazzal az írásmóddal add meg, különben két külön kategória lesz belőle.",
      date: "Dátum",
      dateHint: "Mikor készültek a képek (pl. a rendezvény napja)",
      project: "Kapcsolódó projekt",
      images: "Képek",
      missing: "alt hiányzik",
      totalImages: "kép",
      missingTotal: "alt hiányzik",
    }
  : {
      plural: "Gallery",
      singular: "album",
      title: "Album title",
      description: "Description",
      descriptionHint: "Short intro shown above the album (optional)",
      category: "Category",
      categoryHint: "e.g. Wedding cakes, Office interior",
      categoryHelp:
        "Albums can be filtered by category on the website. Use the same spelling every time.",
      date: "Date",
      dateHint: "When the photos were taken",
      project: "Related project",
      images: "Images",
      missing: "missing alt",
      totalImages: "images",
      missingTotal: "missing alt",
    };

/** Legfeljebb ennyi kép albumonként (a Cloudinary-n bőven elfér). */
export const MAX_ALBUM_IMAGES = 100;

export const galleryDef: ContentTypeDef = {
  addonId: "gallery",
  entity: "album",
  icon: ImagesIcon,
  labels: () => ({ plural: L.plural, singular: L.singular, title: L.title }),
  hasPage: true,
  maxImages: MAX_ALBUM_IMAGES,
  fields: (core) => {
    const projects = contentOptions(core, "projects");
    return [
      {
        name: "description",
        label: L.description,
        type: "textarea",
        required: false,
        wide: true,
        hint: L.descriptionHint,
      },
      {
        name: "category",
        label: L.category,
        type: "text",
        required: false,
        hint: L.categoryHint,
        help: L.categoryHelp,
      },
      { name: "date", label: L.date, type: "date", required: false, hint: L.dateHint },
      ...(projects.length
        ? [
            {
              name: "projectId",
              label: L.project,
              type: "relation" as const,
              required: false,
              options: projects,
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
    {
      key: "category",
      header: L.category,
      hideOnMobile: true,
      cell: (i) => (i.category ? <Badge variant="accent">{String(i.category)}</Badge> : "—"),
    },
    {
      key: "images",
      header: L.images,
      cell: (i) => {
        const missing = missingAltCount(i.images);
        return (
          <span className="flex flex-wrap items-center gap-1.5 whitespace-nowrap">
            {i.images.length}
            {missing > 0 && (
              <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300">
                {missing} {L.missing}
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      key: "date",
      header: L.date,
      hideOnMobile: true,
      cell: (i) => formatDate(typeof i.date === "string" ? i.date : null),
    },
  ],
  preview: (i) => String(i.description ?? ""),
  stats: (items) => {
    const total = items.reduce((n, i) => n + i.images.length, 0);
    const missing = items.reduce((n, i) => n + missingAltCount(i.images), 0);
    return [
      { label: L.totalImages, value: String(total) },
      ...(missing ? [{ label: L.missingTotal, value: String(missing) }] : []),
    ];
  },
  seed: (core) => {
    const projects = contentOptions(core, "projects");
    return hu
      ? [
          {
            title: "Irodánk",
            description: "Így dolgozunk – az irodánk és a csapat.",
            category: "Csapat",
            date: "2026-09-15",
            status: "published",
            featured: true,
          },
          {
            title: "Fogászati rendelő – a kész oldal",
            description: "Képernyőképek az elkészült weboldalról, mobilon és asztali gépen.",
            category: "Referencia",
            date: "2026-10-01",
            projectId: projects[0]?.value ?? null,
            status: "published",
          },
          {
            title: "Céges rendezvény 2026",
            description: "",
            category: "Rendezvény",
            date: "2026-11-20",
            status: "draft",
          },
        ]
      : [{ title: "Our office", category: "Team", status: "published" }];
  },
};

/** Az album képei közül hánynál hiányzik az alt szöveg (a weboldal-ellenőrzéshez is). */
export const albumMissingAlt = (album: ContentItem) => missingAltCount(album.images);
