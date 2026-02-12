// next.config.js
const isProd = process.env.NODE_ENV === "production";

module.exports = {
  output: "export",
  trailingSlash: true,
  basePath: isProd ? "/window_shoppr" : "",
  assetPrefix: isProd ? "/window_shoppr/" : "",
  images: { unoptimized: true },
};
