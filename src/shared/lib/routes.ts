/**
 * Read the public base path for static hosting (GitHub Pages).
 */
export const getPublicBasePath = () => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""; // Respect configured base path.
  return basePath.endsWith("/") ? basePath.slice(0, -1) : basePath; // Normalize trailing slash.
};

/**
 * Build a product detail href that works with static exports.
 */
export const buildProductHref = (slug: string) => {
  const basePath = getPublicBasePath(); // Resolve base path once.
  return `${basePath}/product/${slug}/`; // Include trailing slash for static hosting.
};
