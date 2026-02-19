import http from "node:http";
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

const db = openDatabase({ sqlitePath: SERVER_CONFIG.sqlitePath });

/**
 * Return true when the request method mutates backend state.
 */
const isMutationMethod = (method) =>
  method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

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
    handler: handleUpsertBlogArticle,
  },
];

const server = http.createServer(async (req, res) => {
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

  if (isMutationMethod(method)) {
    const allowed = assertMutationOriginAllowed({
      req,
      res,
      allowedOrigins: SERVER_CONFIG.allowedOrigins,
    });
    if (!allowed) {
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
      ...matched.params,
    });
  } catch (error) {
    console.error("API handler error", error);
    writeApiError(res, 500, "Internal server error.");
  }
});

server.listen(SERVER_CONFIG.port, "127.0.0.1", () => {
  console.log(
    `Window Shoppr API server listening on http://127.0.0.1:${SERVER_CONFIG.port}`,
  );
});
