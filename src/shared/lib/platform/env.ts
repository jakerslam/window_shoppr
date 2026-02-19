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
  NEXT_PUBLIC_FEATURE_FLAGS: z.string().trim().optional(), // Optional comma-delimited feature flag overrides for safe experiments.
  NEXT_PUBLIC_AUTH_API_URL: z.string().url().optional(), // Optional external auth API base URL.
  NEXT_PUBLIC_DATA_API_URL: z.string().url().optional(), // Optional external data API base URL.
  NEXT_PUBLIC_ALLOW_JSON_FALLBACK: z.enum(["true", "false"]).optional(), // Controls whether JSON fallback is allowed when SQL/API is unavailable.
  NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG: z.string().trim().min(1).optional(), // Optional Associates tag for auto-minting Amazon links.
  NEXT_PUBLIC_MONITORING_API_URL: z.string().url().optional(), // Optional monitoring endpoint for error/perf envelopes.
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(), // Optional Sentry DSN for direct client-side error reporting.
});

/**
 * Read + validate public env values in one place to keep the rest of the app clean.
 */
const parsePublicEnv = () => {
  const parsed = PUBLIC_ENV_SCHEMA.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
    NEXT_PUBLIC_DEPLOY_TARGET: process.env.NEXT_PUBLIC_DEPLOY_TARGET,
    NEXT_PUBLIC_FEATURE_FLAGS: process.env.NEXT_PUBLIC_FEATURE_FLAGS,
    NEXT_PUBLIC_AUTH_API_URL: process.env.NEXT_PUBLIC_AUTH_API_URL,
    NEXT_PUBLIC_DATA_API_URL: process.env.NEXT_PUBLIC_DATA_API_URL,
    NEXT_PUBLIC_ALLOW_JSON_FALLBACK: process.env.NEXT_PUBLIC_ALLOW_JSON_FALLBACK,
    NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG,
    NEXT_PUBLIC_MONITORING_API_URL: process.env.NEXT_PUBLIC_MONITORING_API_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
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
    allowJsonFallback: data.NEXT_PUBLIC_ALLOW_JSON_FALLBACK
      ? data.NEXT_PUBLIC_ALLOW_JSON_FALLBACK === "true"
      : true, // Default to true for compatibility; production runtime can explicitly disable.
    amazonAssociateTag: data.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? "", // Optional auto-mint tag for Amazon submission links.
    monitoringApiUrl: data.NEXT_PUBLIC_MONITORING_API_URL ?? "", // Optional monitoring endpoint for runtime errors and trace signals.
    sentryDsn: data.NEXT_PUBLIC_SENTRY_DSN ?? "", // Optional Sentry DSN for direct error reporting adapter.
  };
};

/**
 * Validated, app-wide public env values.
 */
export const PUBLIC_ENV = parsePublicEnv(); // Parse once at module load for stable results.
