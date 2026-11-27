import { z } from "zod";

// Build-time public settings (Vite convention: VITE_*). Az ügyfélspecifikus
// beállítások a crm.config.ts-ben vannak; ide csak környezetfüggő értékek
// kerüljenek. A VITE_* értékek a böngészőbe kerülnek – titkos kulcsot
// (pl. Cloudinary API secret) SOHA ne tegyél ide.
const envSchema = z
  .object({
    VITE_API_URL: z.string().url().optional(),
    /** Cloudinary cloud name (Dashboard → Product environment). */
    VITE_CLOUDINARY_CLOUD_NAME: z
      .string()
      .regex(/^[a-z0-9_-]+$/i, "Csak betű, szám, - és _")
      .optional(),
    /** Unsigned upload preset neve (Settings → Upload → Upload presets). */
    VITE_CLOUDINARY_UPLOAD_PRESET: z.string().min(1).optional(),
  })
  .refine(
    (e) => !e.VITE_CLOUDINARY_CLOUD_NAME === !e.VITE_CLOUDINARY_UPLOAD_PRESET,
    "A VITE_CLOUDINARY_CLOUD_NAME és a VITE_CLOUDINARY_UPLOAD_PRESET csak együtt adható meg"
  );

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL || undefined,
  VITE_CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || undefined,
  VITE_CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || undefined,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
}

export const env = parsed.data;
