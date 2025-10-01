import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.zeg.de",
      },
    ],
  },
  turbopack: {
    // Ensure the correct workspace root to avoid parent lockfile inference
    root: process.cwd(),
  },
};

export default nextConfig;
