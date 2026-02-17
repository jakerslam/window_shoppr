import { z } from "zod";

const DEFAULT_SITE_URL = "https://window-shoppr.com"; // Safe production fallback when env is not configured.

/**
 * Validate the optional basePath used for static hosting (GitHub Pages).
 */
const BASE_PATH_SCHEMA = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      (value.startsWith("/") && (value.length === 1 || !value.endsWith("/"))),
    {
      message:
        "NEXT_PUBLIC_BASE_PATH must be empty or start with '/' and not end with '/'",
    },
  );

/**
 * Public, client-safe environment variables (NEXT_PUBLIC_* only).
 */
const PUBLIC_ENV_SCHEMA = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(), // Canonical site URL for metadata/canonicals.
  NEXT_PUBLIC_BASE_PATH: BASE_PATH_SCHEMA.optional(), // Static hosting base path (e.g. /window_shoppr).
  NEXT_PUBLIC_DEPLOY_TARGET: z.enum(["static-export", "runtime"]).optional(), // Select static-export (GitHub Pages) or runtime mode (ISR/edge deployments).
  NEXT_PUBLIC_AUTH_API_URL: z.string().url().optional(), // Optional external auth API base URL.
  NEXT_PUBLIC_DATA_API_URL: z.string().url().optional(), // Optional external data API base URL.
  NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG: z.string().trim().min(1).optional(), // Optional Associates tag for auto-minting Amazon links.
  NEXT_PUBLIC_MONITORING_API_URL: z.string().url().optional(), // Optional monitoring endpoint for error/perf envelopes.
});

/**
 * Read + validate public env values in one place to keep the rest of the app clean.
 */
const parsePublicEnv = () => {
  const parsed = PUBLIC_ENV_SCHEMA.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
    NEXT_PUBLIC_DEPLOY_TARGET: process.env.NEXT_PUBLIC_DEPLOY_TARGET,
    NEXT_PUBLIC_AUTH_API_URL: process.env.NEXT_PUBLIC_AUTH_API_URL,
    NEXT_PUBLIC_DATA_API_URL: process.env.NEXT_PUBLIC_DATA_API_URL,
    NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG,
    NEXT_PUBLIC_MONITORING_API_URL: process.env.NEXT_PUBLIC_MONITORING_API_URL,
  }); // Pull only public vars so this module is safe in client bundles.

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; "); // Build a readable error string for logs.

    if (process.env.NODE_ENV === "production") {
      throw new Error(`Invalid public env configuration: ${formatted}`); // Fail fast in production builds.
    }

    console.warn(`Invalid public env configuration (using defaults): ${formatted}`); // Warn during local dev.
  }

  const data = parsed.success ? parsed.data : {}; // Fall back to empty object when validation fails.

  return {
    siteUrl: data.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL, // Canonical URL for metadata + sitemap.
    basePath: data.NEXT_PUBLIC_BASE_PATH ?? "", // Base path for static assets and routes.
    deployTarget: data.NEXT_PUBLIC_DEPLOY_TARGET ?? "static-export", // Deployment mode toggle for static export vs runtime caching.
    authApiUrl: data.NEXT_PUBLIC_AUTH_API_URL ?? "", // Optional auth API endpoint for backend session wiring.
    dataApiUrl: data.NEXT_PUBLIC_DATA_API_URL ?? "", // Optional data API endpoint for SQL-backed catalog and submissions.
    amazonAssociateTag: data.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? "", // Optional auto-mint tag for Amazon submission links.
    monitoringApiUrl: data.NEXT_PUBLIC_MONITORING_API_URL ?? "", // Optional monitoring endpoint for runtime errors and trace signals.
  };
};

/**
 * Validated, app-wide public env values.
 */
export const PUBLIC_ENV = parsePublicEnv(); // Parse once at module load for stable results.
