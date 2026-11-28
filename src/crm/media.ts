/*
 * Képfeltöltés. Ha a Cloudinary be van állítva (VITE_CLOUDINARY_* környezeti
 * változók), oda tölt fel közvetlenül a böngészőből (unsigned upload preset);
 * egyébként kicsinyítve a böngésző tárolójába menti (data: URL).
 * Bármely bővítmény használhatja: getImageUploader().upload(file, ...).
 */
import { env } from "@/src/env";

export type UploadedImage = {
  url: string;
  /** Cloudinary public_id (helyi tárolásnál null). */
  publicId: string | null;
  width: number | null;
  height: number | null;
};

/** Egy rekordhoz csatolt kép (bővítmények közösen használják). */
export interface MediaImage {
  id: string;
  /** https URL (Cloudinary vagy külső) vagy helyi tárolásnál data: URL. */
  url: string;
  /**
   * Alt (helyettesítő) szöveg: mit mutat a kép. Akadálymentesség és SEO
   * miatt minden képhez meg kell adni – a felület figyelmeztet, ha hiányzik.
   */
  alt?: string;
  /** Képaláírás (a weboldalon a kép alatt látszik; nem helyettesíti az altot). */
  caption: string;
  /** Cloudinary public_id – törléshez / szinkronhoz. */
  publicId?: string | null;
  width?: number | null;
  height?: number | null;
}

/** Hány képnél hiányzik az alt szöveg. */
export function missingAltCount(images: { alt?: string }[]): number {
  return images.filter((i) => !i.alt?.trim()).length;
}

/** A kép alt attribútuma megjelenítéshez: alt szöveg, különben felirat. */
export const altOf = (img: { alt?: string; caption?: string }, fallback = "") =>
  img.alt?.trim() || img.caption?.trim() || fallback;

export type UploadOptions = {
  /** Cloudinary mappa, pl. "synel-crm/properties/RE-1001". */
  folder?: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

export interface ImageUploader {
  provider: "cloudinary" | "local";
  upload(file: File, options?: UploadOptions): Promise<UploadedImage>;
}

/** Cloudinary ingyenes csomag: max. 10 MB / kép. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export class UploadError extends Error {
  constructor(
    public code: "not-image" | "too-large" | "network" | "rejected" | "aborted",
    message: string
  ) {
    super(message);
  }
}

export function checkImageFile(file: File) {
  if (!file.type.startsWith("image/")) throw new UploadError("not-image", file.name);
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("too-large", file.name);
}

// ─── Cloudinary ─────────────────────────────────────────────────────────

export type CloudinarySettings = { cloudName: string; uploadPreset: string };

export const cloudinaryUploadUrl = (cloudName: string) =>
  `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;

/** A Cloudinary upload API válaszából a nekünk kellő mezők. */
export function parseCloudinaryResponse(status: number, body: unknown): UploadedImage {
  const b = (body ?? {}) as {
    secure_url?: string;
    public_id?: string;
    width?: number;
    height?: number;
    error?: { message?: string };
  };
  if (status < 200 || status >= 300 || !b.secure_url) {
    throw new UploadError("rejected", b.error?.message ?? `HTTP ${status}`);
  }
  return {
    url: b.secure_url,
    publicId: b.public_id ?? null,
    width: b.width ?? null,
    height: b.height ?? null,
  };
}

export function cloudinaryUploader(settings: CloudinarySettings): ImageUploader {
  return {
    provider: "cloudinary",
    upload(file, { folder, onProgress, signal } = {}) {
      checkImageFile(file);
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", settings.uploadPreset);
      if (folder) form.append("folder", folder);

      // XHR a feltöltési százalék miatt (a fetch ezt nem adja).
      return new Promise<UploadedImage>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", cloudinaryUploadUrl(settings.cloudName));
        xhr.responseType = "json";
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          try {
            resolve(parseCloudinaryResponse(xhr.status, xhr.response));
          } catch (err) {
            reject(err);
          }
        };
        xhr.onerror = () => reject(new UploadError("network", file.name));
        xhr.onabort = () => reject(new UploadError("aborted", file.name));
        signal?.addEventListener("abort", () => xhr.abort());
        xhr.send(form);
      });
    },
  };
}

/**
 * Cloudinary kép-URL transzformációval (automatikus formátum/minőség,
 * méretre vágás). Nem Cloudinary URL-t változatlanul ad vissza.
 */
export function imageUrl(url: string, size?: { width: number; height?: number }): string {
  const m = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/.exec(url);
  if (!m) return url;
  const parts = ["f_auto", "q_auto"];
  if (size) {
    parts.push(size.height ? "c_fill" : "c_limit", `w_${size.width}`);
    if (size.height) parts.push(`h_${size.height}`);
  }
  return `${m[1]}${parts.join(",")}/${m[2]}`;
}

// ─── Helyi (böngésző) tárolás ───────────────────────────────────────────

/** Kép kicsinyítése (max. 1280 px, JPEG), hogy elférjen a böngésző tárolójában. */
async function downscale(file: File, max = 1280) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return { url: canvas.toDataURL("image/jpeg", 0.78), width: canvas.width, height: canvas.height };
}

export function localUploader(): ImageUploader {
  return {
    provider: "local",
    async upload(file, { onProgress } = {}) {
      checkImageFile(file);
      let img;
      try {
        img = await downscale(file);
      } catch {
        throw new UploadError("not-image", file.name);
      }
      onProgress?.(100);
      return { ...img, publicId: null };
    },
  };
}

// ─── Választás ──────────────────────────────────────────────────────────

let uploader: ImageUploader | null = null;

export function getImageUploader(): ImageUploader {
  if (!uploader) {
    const { VITE_CLOUDINARY_CLOUD_NAME: cloudName, VITE_CLOUDINARY_UPLOAD_PRESET: uploadPreset } =
      env;
    uploader =
      cloudName && uploadPreset ? cloudinaryUploader({ cloudName, uploadPreset }) : localUploader();
  }
  return uploader;
}

/** Cloudinary mappanév-részlet tisztítása (ékezet, szóköz, tiltott karakterek). */
export function folderSegment(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^0-9A-Za-z_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
