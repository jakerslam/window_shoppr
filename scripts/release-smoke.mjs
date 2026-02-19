import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requiredRoutes = [
  "/index.html",
  "/wishlist/index.html",
  "/login/index.html",
  "/signup/index.html",
  "/robots.txt",
  "/sitemap.xml",
];

const outDir = resolve(process.cwd(), "out");
if (!existsSync(outDir)) {
  throw new Error("Release smoke check failed: out/ does not exist. Run build first.");
}

for (const route of requiredRoutes) {
  const filePath = resolve(outDir, `.${route}`);
  if (!existsSync(filePath)) {
    throw new Error(`Release smoke check failed: missing ${route}`);
  }
}

const home = readFileSync(resolve(outDir, "index.html"), "utf8");
if (!/Window Shoppr/i.test(home)) {
  throw new Error("Release smoke check failed: homepage missing Window Shoppr branding.");
}

console.log("Release smoke checks passed.");
