import type { NextConfig } from "next";

// Trigger rebuild 2

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.zeg.de",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  turbopack: {
    // Ensure the correct workspace root to avoid parent lockfile inference
    root: process.cwd(),
  },
};

export default nextConfig;
