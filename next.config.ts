import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/shared/lib/platform/security";

const REPO_NAME = "window_shoppr"; // GitHub Pages repo name.
const isProd = process.env.NODE_ENV === "production"; // Detect production builds.
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? (isProd ? `/${REPO_NAME}` : ""); // Allow overrides.
const securityHeaders = buildSecurityHeaders(isProd); // Baseline headers for hosted deployments.

const nextConfig: NextConfig = {
  output: "export", // Generate a static export for GitHub Pages.
  trailingSlash: true, // Ensure directory-style URLs for static hosting.
  basePath, // Prefix routes when hosted from a repo subpath.
  assetPrefix: basePath ? `${basePath}/` : undefined, // Prefix static assets in production.
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
