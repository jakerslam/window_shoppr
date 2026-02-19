import { resolve } from "node:path";

/**
 * Parse a comma-delimited env var into a trimmed allowlist.
 */
const parseCommaList = (raw) =>
  String(raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

/**
 * Runtime configuration for the local Data API + Auth API server.
 */
export const SERVER_CONFIG = {
  port: Number.parseInt(process.env.WINDOW_SHOPPR_API_PORT ?? "", 10) || 8787,
  sqlitePath:
    process.env.WINDOW_SHOPPR_SQLITE_PATH ||
    resolve(process.cwd(), "db", "window-shoppr.sqlite"),
  databaseUrl: String(process.env.DATABASE_URL ?? "").trim(),
  autoMigrate:
    String(process.env.WINDOW_SHOPPR_AUTO_MIGRATE ?? "").trim() === "true"
      ? true
      : String(process.env.WINDOW_SHOPPR_AUTO_MIGRATE ?? "").trim() === "false"
        ? false
        : process.env.NODE_ENV !== "production",
  seedFromJson:
    String(process.env.WINDOW_SHOPPR_SEED_FROM_JSON ?? "").trim() === "true"
      ? true
      : String(process.env.WINDOW_SHOPPR_SEED_FROM_JSON ?? "").trim() === "false"
        ? false
        : process.env.NODE_ENV !== "production",
  allowedOrigins: parseCommaList(
    process.env.ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_ALLOWED_ORIGINS,
  ),
  agentApiKey: String(process.env.AGENT_API_KEY ?? "").trim(),
};
