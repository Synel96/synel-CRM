/*
 * Blog – a tartalomtípus leírása. Markdown-tartalom szerkesztővel és
 * előnézettel, kivonat, címkék, szerző, olvasási idő, időzített publikálás.
 * A tartalom Markdownként tárolódik (`body`), így a weboldal bármilyen
 * Markdown-renderelővel megjelenítheti.
 */
import { NewspaperIcon } from "lucide-react";
import crmConfig from "@/crm.config";
import { Badge } from "@/components/ui/badge";
import { isScheduled, type ContentItem } from "@/src/crm/content/logic";
import type { ContentTypeDef } from "@/src/crm/content/types";
import { formatDate } from "@/src/crm/i18n";
import { altOf } from "@/src/crm/media";
import { readingMinutes } from "@/src/crm/markdown";

const hu = crmConfig.locale === "hu";
export const L = hu
  ? {
      plural: "Blog",
      singular: "bejegyzés",
      title: "Cím",
      excerpt: "Kivonat",
      excerptHint: "1–2 mondat a listákba és a megosztáshoz",
      excerptHelp:
        "A kivonat a bejegyzés rövid összefoglalója: a blog listaoldalán, a kártyákon és ha nincs külön SEO-leírás, a Google-találatban is ez jelenik meg. Legyen 1–2 mondat, ami kedvet csinál az elolvasáshoz.",
      body: "Tartalom",
      tags: "Címkék",
      tagsHint: "Vesszővel elválasztva, pl. weboldal, SEO",
      author: "Szerző",
      publishedAt: "Megjelenés ideje",
      publishedAtHelp:
        "Mikor jelenjen meg a bejegyzés a weboldalon. Ha üresen hagyod, a publikálás pillanatában jelenik meg.\n\nIdőzítéshez adj meg egy jövőbeli időpontot, és állítsd a státuszt „Publikált”-ra: a listában „Időzítve” látszik, és a weboldal csak az időpont után mutatja.",
      published: "Megjelenés",
      readingTime: "Olvasás",
      minutes: "perc",
      scheduled: "időzítve",
    }
  : {
      plural: "Blog",
      singular: "post",
      title: "Title",
      excerpt: "Excerpt",
      excerptHint: "1–2 sentences for lists and sharing",
      excerptHelp:
        "A short summary shown on the blog list, cards, and in Google results when no SEO description is set.",
      body: "Content",
      tags: "Tags",
      tagsHint: "Comma separated, e.g. website, SEO",
      author: "Author",
      publishedAt: "Publish time",
      publishedAtHelp:
        "When the post goes live. Leave empty to publish immediately. To schedule, set a future time and status “Published”.",
      published: "Published",
      readingTime: "Reading",
      minutes: "min",
      scheduled: "scheduled",
    };

const tagsOf = (i: ContentItem) => (Array.isArray(i.tags) ? (i.tags as string[]) : []);

export const blogDef: ContentTypeDef = {
  addonId: "blog",
  entity: "post",
  icon: NewspaperIcon,
  labels: () => ({ plural: L.plural, singular: L.singular, title: L.title }),
  hasPage: true,
  maxImages: 20,
  defaults: () => ({ author: crmConfig.brand.name }),
  fields: (_core, item) => [
    {
      name: "excerpt",
      label: L.excerpt,
      type: "textarea",
      required: false,
      wide: true,
      hint: L.excerptHint,
      help: L.excerptHelp,
    },
    {
      name: "body",
      label: L.body,
      type: "markdown",
      required: true,
      wide: true,
      // A bejegyzéshez feltöltött képek beszúrhatók (alt szöveggel).
      images: (item?.images ?? []).map((img) => ({ id: img.id, url: img.url, alt: altOf(img) })),
    },
    { name: "tags", label: L.tags, type: "tags", required: false, hint: L.tagsHint },
    { name: "author", label: L.author, type: "text", required: false },
    {
      name: "publishedAt",
      label: L.publishedAt,
      type: "datetime",
      required: false,
      help: L.publishedAtHelp,
    },
  ],
  // Az olvasási idő mentéskor kiszámolódik, így a weboldalnak nem kell.
  transform: (patch) => ({ ...patch, readingTime: readingMinutes(String(patch.body ?? "")) }),
  columns: () => [
    {
      key: "published",
      header: L.published,
      hideOnMobile: true,
      cell: (i) =>
        i.publishedAt ? (
          formatDate(i.publishedAt)
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "tags",
      header: L.tags,
      hideOnMobile: true,
      cell: (i) => (
        <span className="flex flex-wrap gap-1">
          {tagsOf(i).map((tag) => (
            <Badge key={tag} variant="accent">
              {tag}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      key: "reading",
      header: L.readingTime,
      hideOnMobile: true,
      cell: (i) => `${readingMinutes(String(i.body ?? ""))} ${L.minutes}`,
    },
  ],
  preview: (i) => String(i.excerpt ?? ""),
  stats: (items) => {
    const n = items.filter((i) => isScheduled(i)).length;
    return n ? [{ label: L.scheduled, value: String(n) }] : [];
  },
  seed: () => {
    const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString();
    return hu
      ? [
          {
            title: "5 jel, hogy ideje megújítani a weboldaladat",
            excerpt:
              "Lassú, nem mobilbarát, és nem hoz ajánlatkérést? Mutatjuk, mikor éri meg a váltás.",
            body: `Egy elavult weboldal csendben viszi el az ügyfeleket. Íme öt jel, amire érdemes figyelni.

## 1. Mobilon nehéz használni

A látogatók **több mint fele** telefonról érkezik. Ha nagyítani kell, vagy elcsúszik a menü, elmennek.

## 2. Lassan tölt be

Minden plusz másodperc csökkenti az ajánlatkérések számát.

## 3. Nem jönnek ajánlatkérések

- nincs jól látható kapcsolatfelvételi gomb
- túl hosszú az űrlap
- nem derül ki, mit kínálsz

> Egy jó weboldal nem csak szép, hanem dolgozik helyetted.

Kérdésed van? [Írj nekünk](https://synelweb.hu/kapcsolat)!`,
            tags: ["weboldal", "tippek"],
            author: crmConfig.brand.name,
            status: "published",
            publishedAt: day(-12),
            featured: true,
          },
          {
            title: "Mire jó egy CRM egy kisvállalkozásnak?",
            excerpt: "Ügyfelek, ajánlatok és teendők egy helyen – papír és táblázatok helyett.",
            body: `## Miért nem elég egy táblázat?

A táblázat addig működik, amíg _egy ember_ használja. Utána elvesznek az információk.

1. Minden ügyfél története egy helyen
2. Emlékeztetők a visszahívásokra
3. Látod, mennyi pénz van a pipeline-ban`,
            tags: ["CRM", "ügyfélkezelés"],
            author: crmConfig.brand.name,
            status: "published",
            publishedAt: day(3),
          },
          {
            title: "SEO-alapok: így talál meg a Google",
            excerpt: "Címek, leírások, képek alt szövege – a legfontosabb lépések kezdőknek.",
            body: `## Kezdd a címekkel

Minden oldalnak legyen egyedi, beszédes címe.

## Ne felejtsd el az alt szövegeket

A képek leírása segít a látássérült látogatóknak és a Google-nek is.`,
            tags: ["SEO"],
            author: crmConfig.brand.name,
            status: "draft",
          },
        ]
      : [
          {
            title: "5 signs it's time to redesign your website",
            excerpt: "Slow, not mobile-friendly and no inquiries?",
            body: "## Mobile first\n\nMost visitors are on phones.",
            tags: ["website"],
            status: "published",
            publishedAt: day(-12),
          },
        ];
  },
};
