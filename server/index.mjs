import http from "node:http";
import { randomBytes } from "node:crypto";
import { SERVER_CONFIG } from "./config.mjs";
import { openDatabase } from "./db.mjs";
import { matchRoute } from "./router.mjs";
import { applyCors, readJsonBody, writeApiError, writeApiOk } from "./utils.mjs";
import {
  handleAuthLogin,
  handleAuthLogout,
  handleAuthSignup,
  handleAuthSocial,
} from "./routes/auth.mjs";
import {
  handleAffiliateMintQueueItem,
  handleAnalyticsEvents,
  handleAuthAudit,
  handleDealSubmission,
  handleEmailCapture,
  handleGetBlogArticles,
  handleGetProductBySlug,
  handleGetProducts,
  handlePurchaseIntent,
  handleSaveDelta,
  handleUpsertBlogArticle,
  handleWishlistSync,
} from "./routes/data.mjs";

const db = await openDatabase({
  sqlitePath: SERVER_CONFIG.sqlitePath,
  databaseUrl: SERVER_CONFIG.databaseUrl,
  autoMigrate: SERVER_CONFIG.autoMigrate,
  seedFromJson: SERVER_CONFIG.seedFromJson,
});

/**
 * Generate a short request correlation id for structured logs and debugging.
 */
const createRequestId = () => `req_${randomBytes(8).toString("hex")}`;

/**
 * Return a best-effort client IP address for abuse protection.
 */
const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket.remoteAddress ?? "unknown";
};

const RATE_LIMIT_STATE = new Map();

/**
 * Simple fixed-window rate limiter (reference implementation).
 *
 * Notes:
 * - In-memory only (per-instance). Production should also use WAF/CDN limits.
 */
const consumeRateLimit = ({ key, limit, windowMs }) => {
  const now = Date.now();
  const current = RATE_LIMIT_STATE.get(key);
  if (!current || now >= current.resetAtMs) {
    const next = { count: 1, resetAtMs: now + windowMs };
    RATE_LIMIT_STATE.set(key, next);
    return { ok: true, retryAfterMs: 0 };
  }

  current.count += 1;
  if (current.count <= limit) {
    return { ok: true, retryAfterMs: 0 };
  }

  return { ok: false, retryAfterMs: Math.max(0, current.resetAtMs - now) };
};

/**
 * Return true when the request method mutates backend state.
 */
const isMutationMethod = (method) =>
  method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

/**
 * Enforce agent/admin API key for privileged routes.
 */
const assertAgentKey = ({ req, res }) => {
  if (!SERVER_CONFIG.agentApiKey) {
    writeApiError(res, 503, "Agent API key not configured.");
    return false;
  }

  const supplied = String(req.headers["x-agent-key"] ?? "").trim();
  if (!supplied || supplied !== SERVER_CONFIG.agentApiKey) {
    writeApiError(res, 401, "Unauthorized.");
    return false;
  }

  return true;
};

/**
 * Enforce a basic origin allowlist for mutation calls when configured.
 */
const assertMutationOriginAllowed = ({ req, res, allowedOrigins }) => {
  if (allowedOrigins.length === 0) {
    return true; // Allow all mutation origins when allowlist is empty (local dev default).
  }

  const assertedOrigin = String(req.headers["x-window-origin"] ?? "").trim();
  if (!assertedOrigin || !allowedOrigins.includes(assertedOrigin)) {
    writeApiError(res, 403, "Request blocked by origin policy.");
    return false;
  }

  const csrfToken = String(req.headers["x-csrf-token"] ?? "").trim();
  if (!csrfToken) {
    writeApiError(res, 403, "Missing CSRF token.");
    return false;
  }

  return true;
};

const routes = [
  {
    method: "GET",
    pattern: /^\/health$/,
    handler: async ({ res }) => writeApiOk(res, { ok: true }),
  },
  {
    method: "POST",
    pattern: /^\/auth\/signup$/,
    handler: handleAuthSignup,
  },
  {
    method: "POST",
    pattern: /^\/auth\/login$/,
    handler: handleAuthLogin,
  },
  {
    method: "POST",
    pattern: /^\/auth\/social$/,
    handler: handleAuthSocial,
  },
  {
    method: "POST",
    pattern: /^\/auth\/logout$/,
    handler: handleAuthLogout,
  },
  {
    method: "GET",
    pattern: /^\/data\/products$/,
    handler: handleGetProducts,
  },
  {
    method: "GET",
    pattern: /^\/data\/products\/([^/]+)$/,
    getParams: (match) => ({ slug: decodeURIComponent(match[1]) }),
    handler: handleGetProductBySlug,
  },
  {
    method: "POST",
    pattern: /^\/data\/email-captures$/,
    handler: handleEmailCapture,
  },
  {
    method: "POST",
    pattern: /^\/data\/purchase-intents$/,
    handler: handlePurchaseIntent,
  },
  {
    method: "POST",
    pattern: /^\/data\/auth\/audit$/,
    handler: handleAuthAudit,
  },
  {
    method: "POST",
    pattern: /^\/data\/analytics\/events$/,
    handler: handleAnalyticsEvents,
  },
  {
    method: "POST",
    pattern: /^\/data\/social-proof\/saves$/,
    handler: handleSaveDelta,
  },
  {
    method: "POST",
    pattern: /^\/data\/submissions\/link$/,
    handler: handleDealSubmission,
  },
  {
    method: "POST",
    pattern: /^\/data\/submissions\/affiliate-mint$/,
    requiresAgentKey: true,
    rateLimit: { limit: 120, windowMs: 60_000 },
    handler: handleAffiliateMintQueueItem,
  },
  {
    method: "POST",
    pattern: /^\/data\/wishlist\/sync$/,
    handler: handleWishlistSync,
  },
  {
    method: "GET",
    pattern: /^\/data\/blog\/articles$/,
    handler: handleGetBlogArticles,
  },
  {
    method: "POST",
    pattern: /^\/data\/blog\/articles\/upsert$/,
    requiresAgentKey: true,
    rateLimit: { limit: 60, windowMs: 60_000 },
    handler: handleUpsertBlogArticle,
  },
];

const server = http.createServer(async (req, res) => {
  const requestId = createRequestId();
  const startMs = Date.now();
  res.setHeader("x-request-id", requestId);

  applyCors({ req, res, allowedOrigins: SERVER_CONFIG.allowedOrigins });

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = url.pathname;

  const matched = matchRoute({ method, pathname, routes });
  if (!matched) {
    writeApiError(res, 404, "Route not found.");
    return;
  }

  if (matched.route?.requiresAgentKey) {
    const allowed = assertAgentKey({ req, res });
    if (!allowed) {
      return;
    }
  }

  if (isMutationMethod(method) && !matched.route?.requiresAgentKey) {
    const allowed = assertMutationOriginAllowed({
      req,
      res,
      allowedOrigins: SERVER_CONFIG.allowedOrigins,
    });
    if (!allowed) {
      return;
    }
  }

  if (isMutationMethod(method)) {
    const rateConfig = matched.route?.rateLimit ?? { limit: 240, windowMs: 60_000 };
    const ip = getClientIp(req);
    const key = `${ip}:${matched.route?.pattern?.source ?? pathname}`;
    const rate = consumeRateLimit({ key, ...rateConfig });
    if (!rate.ok) {
      res.setHeader("retry-after", String(Math.ceil(rate.retryAfterMs / 1000)));
      writeApiError(res, 429, "Too many requests. Please try again soon.");
      return;
    }
  }

  let body = null;
  if (isMutationMethod(method)) {
    try {
      body = await readJsonBody(req);
    } catch {
      writeApiError(res, 400, "Invalid JSON body.");
      return;
    }
  }

  try {
    await matched.handler({
      db,
      req,
      res,
      body,
      requestId,
      ...matched.params,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "API handler error",
        requestId,
        pathname,
        method,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    writeApiError(res, 500, "Internal server error.");
  } finally {
    const durationMs = Date.now() - startMs;
    console.log(
      JSON.stringify({
        level: "info",
        msg: "request",
        requestId,
        method,
        pathname,
        statusCode: res.statusCode,
        durationMs,
      }),
    );
  }
});

server.listen(SERVER_CONFIG.port, () => {
  console.log(
    `Window Shoppr API server listening on http://0.0.0.0:${SERVER_CONFIG.port}`,
  );
});

/**
 * Gracefully close server + DB connections on shutdown (production-friendly).
 */
const shutdown = (signal) => {
  console.log(JSON.stringify({ level: "info", msg: "shutdown", signal }));

  server.close(async () => {
    try {
      await db.close?.();
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          msg: "shutdown_db_close_failed",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      process.exit(0);
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
