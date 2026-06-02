import { z } from "zod"

/**
 * Environment variable validation schema.
 * 
 * This validates that all required environment variables are set
 * when the server starts, providing clear error messages instead
 * of cryptic runtime failures.
 */

const serverEnvSchema = z.object({
  // ─── Supabase ───
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // ─── NextAuth ───
  NEXTAUTH_URL: z
    .string()
    .url("NEXTAUTH_URL must be a valid URL")
    .optional(),
  NEXTAUTH_SECRET: z
    .string()
    .min(1, "NEXTAUTH_SECRET is required"),

  // ─── Google OAuth ───
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // ─── Email (at least one provider should be set) ───
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().optional(),
  RESEND_API_KEY: z.string().optional(),

  // ─── Payments ───
  KKIAPAY_WEBHOOK_SECRET: z.string().optional(),

  // ─── AI ───
  REPLICATE_API_TOKEN: z.string().optional(),
})

/**
 * Validate environment variables.
 * Call this at app startup to catch missing vars early.
 * 
 * Returns the parsed and typed env object.
 * Throws with clear error messages if validation fails.
 */
export function validateEnv() {
  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `  ❌ ${key}: ${msgs?.join(", ")}`)
      .join("\n")

    console.error(
      `\n🚨 Environment variable validation failed:\n${errorMessages}\n`
    )

    // In production, throw to prevent startup with missing config
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Missing or invalid environment variables. Check server logs.`
      )
    }
  }

  return result.data
}

// Validate on module load (server-side only)
if (typeof window === "undefined") {
  validateEnv()
}
