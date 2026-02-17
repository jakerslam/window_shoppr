import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/shared/lib/platform/security";

const REPO_NAME = "window_shoppr"; // GitHub Pages repo name.
const isProd = process.env.NODE_ENV === "production"; // Detect production builds.
const deployTarget =
  process.env.DEPLOY_TARGET ??
  process.env.NEXT_PUBLIC_DEPLOY_TARGET ??
  "static-export"; // Default to static-export for current GitHub Pages flow.
const isStaticExport = deployTarget === "static-export"; // Gate static-export-only options.
const basePath =
  isStaticExport
    ? process.env.NEXT_PUBLIC_BASE_PATH ?? (isProd ? `/${REPO_NAME}` : "")
    : ""; // Only use basePath for static-export deployments.
const securityHeaders = buildSecurityHeaders(isProd); // Baseline headers for hosted deployments.

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined, // Generate static export on GitHub Pages; runtime mode enables ISR/edge caching.
  trailingSlash: isStaticExport, // Use directory-style URLs only for static hosting.
  basePath, // Prefix routes when hosted from a repo subpath.
  assetPrefix:
    isStaticExport && basePath ? `${basePath}/` : undefined, // Prefix static assets only when static export is enabled.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]; // Provide baseline security headers when the hosting platform supports them.
  },
  images: {
    unoptimized: true, // Required for static export hosting.
    remotePatterns: [
      { protocol: "https", hostname: "assets.wfcdn.com" },
      { protocol: "https", hostname: "i5.walmartimages.com" },
      { protocol: "https", hostname: "image.chewy.com" },
      { protocol: "https", hostname: "www.softminkyblankets.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "encrypted-tbn1.gstatic.com" },
      { protocol: "https", hostname: "encrypted-tbn2.gstatic.com" },
      { protocol: "https", hostname: "encrypted-tbn3.gstatic.com" },
    ],
  },
};

export default nextConfig;
