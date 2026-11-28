import {
  ArrowDownIcon,
  ArrowUpIcon,
  CloudIcon,
  ImagePlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HelpTip } from "@/components/ui/help-tip";
import { Input, Label } from "@/components/ui/input";
import { t, type MessageKey } from "@/src/crm/i18n";
import {
  altOf,
  getImageUploader,
  imageUrl,
  missingAltCount,
  UploadError,
  type MediaImage,
} from "@/src/crm/media";
import { newId } from "@/src/crm/operations";

type Props = {
  photos: MediaImage[];
  /** Legfeljebb ennyi kép (alap: 30 – az ingatlan.com korlátja). */
  max?: number;
  /** A szakasz címe (alap: „Képek”). */
  title?: string;
  /** Cloudinary mappa ehhez az ingatlanhoz. */
  folder: string;
  /**
   * Új képek hozzáfűzése. Funkcionálisan, a mindenkori legfrissebb adatra
   * kell alkalmazni (párhuzamos feltöltések ne írják felül egymást).
   */
  onAdd: (photos: MediaImage[]) => void;
  /** Sorrend, felirat, törlés. */
  onChange: (photos: MediaImage[]) => void;
};

type Pending = { id: string; name: string; progress: number; error?: string };

const ERROR_KEY: Record<UploadError["code"], MessageKey> = {
  "not-image": "photos.readError",
  "too-large": "photos.tooLarge",
  network: "photos.networkError",
  rejected: "photos.rejected",
  aborted: "photos.aborted",
};

export function PhotoManager({ photos, max = 30, title, folder, onAdd, onChange }: Props) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const missingAlt = missingAltCount(photos);
  const uploader = getImageUploader();
  const uploading = pending.filter((p) => !p.error).length;
  const room = max - photos.length - uploading;
  const full = room <= 0;

  const patchPending = (id: string, patch: Partial<Pending>) =>
    setPending((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function uploadFiles(files: File[]) {
    setError(null);
    if (files.length > room) setError(t("photos.max"));
    const batch = files.slice(0, Math.max(0, room)).map((file) => ({ file, id: newId() }));
    setPending((list) => [
      ...list,
      ...batch.map(({ id, file }) => ({ id, name: file.name, progress: 0 })),
    ]);

    await Promise.all(
      batch.map(async ({ file, id }) => {
        try {
          const img = await uploader.upload(file, {
            folder,
            onProgress: (progress) => patchPending(id, { progress }),
          });
          onAdd([
            {
              id,
              url: img.url,
              publicId: img.publicId,
              width: img.width,
              height: img.height,
              // A fájlnév se aláírásnak, se alt szövegnek nem jó – üresen hagyjuk,
              // a felület figyelmeztet, hogy írják meg.
              alt: "",
              caption: "",
            },
          ]);
          setPending((list) => list.filter((p) => p.id !== id));
        } catch (err) {
          const code = err instanceof UploadError ? err.code : "rejected";
          const detail =
            err instanceof UploadError && code === "rejected" ? `: ${err.message}` : "";
          patchPending(id, { error: t(ERROR_KEY[code]) + detail });
        }
      })
    );
  }

  const move = (i: number, dir: -1 | 1) => {
    const next = [...photos];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <section className="flex flex-col gap-3 border-t pt-4">
      <h3 className="flex items-center justify-between gap-2 text-sm font-semibold">
        <span>
          {title ?? t("photos.title")}{" "}
          <span className="text-muted-foreground font-normal">
            ({photos.length}/{max})
          </span>
        </span>
        {uploader.provider === "cloudinary" && (
          <span className="text-muted-foreground flex items-center gap-1 text-xs font-normal">
            <CloudIcon className="size-3.5" /> Cloudinary
          </span>
        )}
      </h3>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const value = url.trim();
          if (!/^https:\/\/\S+$/i.test(value)) return setError(t("photos.invalidUrl"));
          setError(null);
          onAdd([{ id: newId(), url: value, alt: "", caption: "" }]);
          setUrl("");
        }}
      >
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("photos.urlPlaceholder")}
          aria-label={t("photos.urlPlaceholder")}
          disabled={full}
        />
        <div className="flex gap-2">
          <Button type="submit" variant="outline" disabled={full || !url.trim()}>
            {t("photos.add")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={full}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlusIcon /> {t("photos.upload")}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          aria-label={t("photos.upload")}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void uploadFiles(files);
          }}
        />
      </form>
      {uploader.provider === "local" && (
        <p className="text-muted-foreground text-xs">{t("photos.storageHint")}</p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}

      {pending.length > 0 && (
        <ul className="flex flex-col gap-1.5" aria-live="polite">
          {pending.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {p.error ? (
                <>
                  <span className="text-destructive">{p.error}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t("common.cancel")}
                    onClick={() => setPending((list) => list.filter((x) => x.id !== p.id))}
                  >
                    <XIcon />
                  </Button>
                </>
              ) : (
                <span
                  role="progressbar"
                  aria-label={p.name}
                  aria-valuenow={p.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="bg-muted h-1.5 w-32 overflow-hidden rounded-full"
                >
                  <span
                    className="block h-full bg-(--crm-accent) transition-[width]"
                    style={{ width: `${p.progress}%` }}
                  />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {missingAlt > 0 && (
        <p
          role="status"
          className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-800 dark:text-amber-300"
        >
          <TriangleAlertIcon className="size-3.5 shrink-0" aria-hidden />
          {missingAlt} {t("photos.altMissingCount")}
          <HelpTip label={t("photos.alt")}>{t("photos.altHelp")}</HelpTip>
        </p>
      )}

      {photos.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {photos.map((p, i) => (
            <li key={p.id} className="flex flex-col gap-1.5 rounded-lg border p-1.5">
              <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-md">
                <img
                  src={imageUrl(p.url, { width: 360, height: 270 })}
                  alt={altOf(p)}
                  loading="lazy"
                  className="size-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    {t("photos.cover")}
                  </span>
                )}
              </div>
              <PhotoTextField
                id={`${baseId}-${p.id}-alt`}
                label={t("photos.alt")}
                help={t("photos.altHelp")}
                value={p.alt ?? ""}
                placeholder={t("photos.altPlaceholder")}
                warning={p.alt?.trim() ? undefined : t("photos.altMissing")}
                onChange={(alt) => onChange(photos.map((x) => (x.id === p.id ? { ...x, alt } : x)))}
              />
              <PhotoTextField
                id={`${baseId}-${p.id}-caption`}
                label={t("photos.caption")}
                help={t("photos.captionHelp")}
                value={p.caption}
                onChange={(caption) =>
                  onChange(photos.map((x) => (x.id === p.id ? { ...x, caption } : x)))
                }
              />
              <div className="flex justify-between">
                <span className="flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label={t("photos.moveUp")}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={i === photos.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label={t("photos.moveDown")}
                  >
                    <ArrowDownIcon />
                  </Button>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onChange(photos.filter((x) => x.id !== p.id))}
                  aria-label={t("common.delete")}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Felirattal, „?” súgóval és opcionális figyelmeztetéssel ellátott szövegmező. */
function PhotoTextField({
  id,
  label,
  help,
  value,
  placeholder,
  warning,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  value: string;
  placeholder?: string;
  warning?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1">
        <Label htmlFor={id} className="text-xs">
          {label}
        </Label>
        <HelpTip label={label}>{help}</HelpTip>
      </span>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={warning ? `${id}-warn` : undefined}
        className={cn("h-8 text-xs", warning && "border-amber-500/70")}
      />
      {warning && (
        <span id={`${id}-warn`} className="text-[11px] text-amber-700 dark:text-amber-400">
          {warning}
        </span>
      )}
    </div>
  );
}
