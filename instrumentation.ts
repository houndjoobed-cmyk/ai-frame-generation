/**
 * Next.js Instrumentation — runs once when the server starts.
 * 
 * Used to validate environment variables at boot time, ensuring
 * all required config is present before serving any requests.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validate env vars on server startup
    const { validateEnv } = await import("@/lib/env")
    validateEnv()
  }
}
