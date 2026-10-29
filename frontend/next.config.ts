import type { NextConfig } from "next"

// The app is client-rendered behind a token-based login (token lives in localStorage),
// so Cache Components / partial prerendering are intentionally left off.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
