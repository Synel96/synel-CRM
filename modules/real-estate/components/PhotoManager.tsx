import { ArrowDownIcon, ArrowUpIcon, ImagePlusIcon, Trash2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/src/crm/i18n";
import { newId } from "@/src/crm/operations";
import { rt } from "../i18n";
import { MAX_PHOTOS, type PropertyPhoto } from "../types";

type Props = { photos: PropertyPhoto[]; onChange: (photos: PropertyPhoto[]) => void };

/** Kép kicsinyítése a böngészőben (max. 1280 px, JPEG), hogy elférjen a tárolóban. */
async function downscale(file: File, max = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}

export function PhotoManager({ photos, onChange }: Props) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const full = photos.length >= MAX_PHOTOS;

  const add = (items: PropertyPhoto[]) => {
    const room = MAX_PHOTOS - photos.length;
    if (items.length > room) setError(rt("photos.max"));
    onChange([...photos, ...items.slice(0, room)]);
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...photos];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <section className="flex flex-col gap-3 border-t pt-4">
      <h3 className="text-sm font-semibold">
        {rt("photos.title")}{" "}
        <span className="text-muted-foreground font-normal">
          ({photos.length}/{MAX_PHOTOS})
        </span>
      </h3>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const value = url.trim();
          if (!/^https:\/\/\S+$/i.test(value)) return setError(rt("photos.invalidUrl"));
          setError(null);
          add([{ id: newId(), url: value, caption: "" }]);
          setUrl("");
        }}
      >
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={rt("photos.urlPlaceholder")}
          aria-label={rt("photos.urlPlaceholder")}
          disabled={full}
        />
        <div className="flex gap-2">
          <Button type="submit" variant="outline" disabled={full || !url.trim()}>
            {rt("photos.add")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={full}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlusIcon /> {rt("photos.upload")}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            setError(null);
            const results = await Promise.allSettled(
              files.map(async (file) => ({
                id: newId(),
                url: await downscale(file),
                caption: file.name.replace(/\.[^.]+$/, ""),
              }))
            );
            const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
            if (ok.length < results.length) setError(rt("photos.readError"));
            if (ok.length) add(ok);
          }}
        />
      </form>
      <p className="text-muted-foreground text-xs">{rt("photos.storageHint")}</p>
      {error && <p className="text-destructive text-xs">{error}</p>}

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <li key={p.id} className="flex flex-col gap-1.5 rounded-lg border p-1.5">
              <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-md">
                <img
                  src={p.url}
                  alt={p.caption}
                  loading="lazy"
                  className="size-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    {rt("photos.cover")}
                  </span>
                )}
              </div>
              <Input
                value={p.caption}
                onChange={(e) =>
                  onChange(
                    photos.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x))
                  )
                }
                placeholder={rt("photos.caption")}
                aria-label={`${rt("photos.caption")} ${i + 1}`}
                className="h-7 text-xs"
              />
              <div className="flex justify-between">
                <span className="flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label={rt("photos.moveUp")}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={i === photos.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label={rt("photos.moveDown")}
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
