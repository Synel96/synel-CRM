import { z } from "zod";

// Build-time public settings (Vite convention: VITE_*). Az ügyfélspecifikus
// beállítások a crm.config.ts-ben vannak; ide csak környezetfüggő értékek
// (pl. egy későbbi backend API címe) kerüljenek.
const envSchema = z.object({
  VITE_API_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL || undefined,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
}

export const env = parsed.data;
