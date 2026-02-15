export type SecurityHeader = {
  key: string;
  value: string;
};

/**
 * Default CSP for a static Next.js export.
 * Notes:
 * - We allow 'unsafe-inline' to support Next.js font/style tags + our theme init script.
 * - Tighten this once we move to nonce/hashes and remove inline scripts.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https:",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "media-src 'self' data: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; "); // Join into a single header-safe CSP value.

/**
 * Default referrer policy used when headers are supported.
 */
export const REFERRER_POLICY = "strict-origin-when-cross-origin"; // Limits sensitive URL leakage.

/**
 * Build a baseline set of security headers.
 * Note: static hosting providers may require separate header configuration.
 */
export const buildSecurityHeaders = (isProd: boolean): SecurityHeader[] => {
  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
    { key: "Referrer-Policy", value: REFERRER_POLICY },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ];

  if (isProd) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    }); // Enforce HTTPS in production when supported by the host.
  }

  return headers;
};

