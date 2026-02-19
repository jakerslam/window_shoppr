import { createHash } from "node:crypto";

/**
 * Read and parse a JSON request body safely.
 */
export const readJsonBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return null;
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) {
    return null;
  }

  return JSON.parse(raw);
};

/**
 * Write a JSON response with consistent headers.
 */
export const writeJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

/**
 * Write a normalized API envelope response.
 */
export const writeApiOk = (res, data, statusCode = 200) =>
  writeJson(res, statusCode, { ok: true, data });

/**
 * Write a normalized API error envelope response.
 */
export const writeApiError = (res, statusCode, message) =>
  writeJson(res, statusCode, { ok: false, message });

/**
 * Apply CORS headers based on allowlist configuration.
 */
export const applyCors = ({ req, res, allowedOrigins }) => {
  const origin = req.headers.origin;

  if (!origin) {
    res.setHeader("access-control-allow-origin", "*");
  } else if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "origin");
    res.setHeader("access-control-allow-credentials", "true");
  }

  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader(
    "access-control-allow-headers",
    "content-type,x-csrf-token,x-window-origin,x-agent-key,x-request-id,authorization",
  );
  res.setHeader("access-control-max-age", "86400");
};

/**
 * Return a stable short hash for ids derived from user-provided strings.
 */
export const shortHash = (input) =>
  createHash("sha256").update(String(input)).digest("hex").slice(0, 12);
