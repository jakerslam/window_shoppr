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
  allowedOrigins: parseCommaList(
    process.env.ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_ALLOWED_ORIGINS,
  ),
  agentApiKey: String(process.env.AGENT_API_KEY ?? "").trim(),
};
