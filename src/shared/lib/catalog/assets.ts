import { PUBLIC_ENV } from "@/shared/lib/platform/env";

const BASE_PATH = PUBLIC_ENV.basePath; // Static hosting base path (validated).

/**
 * Build a static-safe asset URL for local public files.
 */
export const toAssetPath = (src: string) => {
  if (!src) {
    return src;
  }

  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src; // Keep absolute and data URLs unchanged.
  }

  if (src.startsWith("/")) {
    return `${BASE_PATH}${src}`; // Prefix public assets with base path.
  }

  return src; // Keep relative paths untouched.
};
