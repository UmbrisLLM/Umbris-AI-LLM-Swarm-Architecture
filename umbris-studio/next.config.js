/**
 * Next.js config for UMBRIS Studio.
 *
 * Tauri requires a static export (no SSR runtime · the WebView serves
 * pre-built HTML/JS from disk). `output: "export"` produces an `out/`
 * directory Tauri points to via tauri.conf.json `build.frontendDist`.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Tauri serves on a custom protocol with no Node runtime.
  reactStrictMode: true,
  transpilePackages: ["@umbris/design"],
  // Disable Next's filesystem caching that conflicts with Tauri's
  // simultaneous dev + build flow.
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;
