import {
  BoldIcon,
  CodeIcon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";
import { Popover } from "radix-ui";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { HelpTip } from "@/components/ui/help-tip";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { t } from "@/src/crm/i18n";
import {
  imageMarkdown,
  imageRef,
  insertBlock,
  markdownImagesMissingAlt,
  prefixLines,
  readingMinutes,
  renderMarkdown,
  wordCount,
  wrapSelection,
  type Edit,
} from "@/src/crm/markdown";
import { imageUrl } from "@/src/crm/media";

export type EditorImage = { id: string; url: string; alt: string };

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Beszúrható képek (a bejegyzéshez feltöltöttek). */
  images?: EditorImage[];
  label: string;
};

type Tool = {
  key: string;
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  run: (s: number, e: number, text: string) => Edit;
};

const previewClass =
  "markdown-body bg-background min-h-72 overflow-auto rounded-lg border px-4 py-3";

export function MarkdownEditor({ id, value, onChange, images = [], label }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  // Az utolsó renderelés eredménye; amíg nem az aktuális szövegé, „Betöltés…”.
  // A képlista minden rendereléskor új tömb – a tartalma alapján képzett kulcs
  // dönti el, kell-e újra renderelni az előnézetet.
  const imagesKey = images.map((i) => `${i.id}:${i.url.length}`).join("|");
  const [rendered, setRendered] = useState<{ src: string; html: string } | null>(null);
  const html = rendered && rendered.src === value + imagesKey ? rendered.html : null;
  const missingAlt = markdownImagesMissingAlt(value);
  const minutes = readingMinutes(value);

  useEffect(() => {
    if (tab !== "preview") return;
    let alive = true;
    void renderMarkdown(value, images).then((out) => {
      if (alive) setRendered({ src: value + imagesKey, html: out });
    });
    return () => {
      alive = false;
    };
    // `images` szándékosan hiányzik: a tartalmát az `imagesKey` képviseli.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, value, imagesKey]);

  /** Módosítás alkalmazása, majd a kijelölés visszaállítása a szövegmezőben. */
  const apply = (edit: Edit) => {
    onChange(edit.text);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(edit.selStart, edit.selEnd);
    });
  };
  const run = (tool: Tool) => {
    const el = ref.current;
    const s = el?.selectionStart ?? value.length;
    const e = el?.selectionEnd ?? value.length;
    apply(tool.run(s, e, value));
  };

  const tools: Tool[] = [
    {
      key: "h2",
      icon: Heading2Icon,
      label: t("md.h2"),
      run: (s, e, x) => prefixLines(x, s, e, "##"),
    },
    {
      key: "h3",
      icon: Heading3Icon,
      label: t("md.h3"),
      run: (s, e, x) => prefixLines(x, s, e, "###"),
    },
    {
      key: "b",
      icon: BoldIcon,
      label: t("md.bold"),
      shortcut: "B",
      run: (s, e, x) => wrapSelection(x, s, e, "**", "**", t("md.boldText")),
    },
    {
      key: "i",
      icon: ItalicIcon,
      label: t("md.italic"),
      shortcut: "I",
      run: (s, e, x) => wrapSelection(x, s, e, "_", "_", t("md.italicText")),
    },
    {
      key: "k",
      icon: LinkIcon,
      label: t("md.link"),
      shortcut: "K",
      run: (s, e, x) => wrapSelection(x, s, e, "[", "](https://)", t("md.linkText")),
    },
    { key: "ul", icon: ListIcon, label: t("md.list"), run: (s, e, x) => prefixLines(x, s, e, "-") },
    {
      key: "ol",
      icon: ListOrderedIcon,
      label: t("md.orderedList"),
      run: (s, e, x) => prefixLines(x, s, e, "1."),
    },
    {
      key: "q",
      icon: QuoteIcon,
      label: t("md.quote"),
      run: (s, e, x) => prefixLines(x, s, e, ">"),
    },
    {
      key: "code",
      icon: CodeIcon,
      label: t("md.code"),
      run: (s, e, x) => wrapSelection(x, s, e, "`", "`", "kód"),
    },
  ];

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const tool = tools.find((x) => x.shortcut?.toLowerCase() === e.key.toLowerCase());
    if (tool) {
      e.preventDefault();
      run(tool);
    }
  };

  const tabClass = (active: boolean) =>
    cn(
      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
      active
        ? "bg-background text-foreground shadow-xs"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="bg-muted/40 flex flex-wrap items-center gap-1 rounded-lg border p-1">
        <div role="tablist" aria-label={label} className="bg-muted order-1 flex rounded-md p-0.5">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "write"}
            className={tabClass(tab === "write")}
            onClick={() => setTab("write")}
          >
            {t("md.write")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "preview"}
            className={tabClass(tab === "preview")}
            onClick={() => setTab("preview")}
          >
            {t("md.preview")}
          </button>
        </div>
        {tab === "write" && (
          <div
            role="toolbar"
            aria-label={t("md.toolbar")}
            aria-controls={id}
            className="order-3 flex w-full flex-wrap items-center sm:order-2 sm:w-auto"
          >
            {tools.map((tool) => (
              <button
                key={tool.key}
                type="button"
                onClick={() => run(tool)}
                aria-label={tool.label}
                title={tool.shortcut ? `${tool.label} (Ctrl+${tool.shortcut})` : tool.label}
                className="text-muted-foreground hover:bg-background hover:text-foreground rounded-md p-1.5"
              >
                <tool.icon className="size-4" aria-hidden />
              </button>
            ))}
            <ImagePicker
              images={images}
              onPick={(img) => {
                const at = ref.current?.selectionEnd ?? value.length;
                apply(insertBlock(value, at, imageMarkdown(imageRef(img), img.alt)));
              }}
            />
          </div>
        )}
        <span className="order-2 ml-auto pr-1 sm:order-3">
          <HelpTip label={t("md.helpTitle")}>{t("md.help")}</HelpTip>
        </span>
      </div>

      {tab === "write" ? (
        <Textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck
          className="min-h-72 font-mono text-[13px] leading-relaxed"
        />
      ) : html === null ? (
        <div role="tabpanel" aria-label={t("md.preview")} className={previewClass}>
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        </div>
      ) : (
        <div
          role="tabpanel"
          aria-label={t("md.preview")}
          className={previewClass}
          // A HTML a DOMPurify-jal tisztított Markdown-kimenet (src/crm/markdown.ts).
          dangerouslySetInnerHTML={{ __html: html || `<p>${t("common.empty")}</p>` }}
        />
      )}

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span>
          {wordCount(value)} {t("md.words")} · {minutes} {t("md.minutes")}
        </span>
        {missingAlt > 0 && (
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
            <TriangleAlertIcon className="size-3.5" aria-hidden />
            {missingAlt} {t("md.missingAlt")}
            <HelpTip label={t("photos.alt")}>{t("md.altHelp")}</HelpTip>
          </span>
        )}
      </div>
    </div>
  );
}

function ImagePicker({
  images,
  onPick,
}: {
  images: EditorImage[];
  onPick: (img: EditorImage) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={t("md.image")}
          title={t("md.image")}
          className="text-muted-foreground hover:bg-background hover:text-foreground rounded-md p-1.5"
        >
          <ImageIcon className="size-4" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="bg-popover text-popover-foreground z-[60] w-[min(20rem,calc(100vw-2rem))] rounded-lg border p-2 text-xs shadow-md"
        >
          {images.length === 0 ? (
            <p className="p-1">{t("md.noImages")}</p>
          ) : (
            <ul className="grid grid-cols-3 gap-1.5" aria-label={t("md.image")}>
              {images.map((img) => (
                <li key={img.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(img);
                      setOpen(false);
                    }}
                    className="focus-visible:ring-ring/50 block w-full overflow-hidden rounded-md border outline-none focus-visible:ring-3"
                    title={img.alt || t("photos.altMissing")}
                  >
                    <img
                      src={imageUrl(img.url, { width: 160, height: 120 })}
                      alt={img.alt}
                      className="aspect-[4/3] w-full object-cover"
                    />
                    {!img.alt && (
                      <span className="block bg-amber-500/15 px-1 text-[10px] text-amber-800 dark:text-amber-300">
                        {t("photos.altMissing")}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Popover.Arrow className="fill-popover" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
