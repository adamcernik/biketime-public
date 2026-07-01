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
        hostname: "cdn-assets.zeg.de",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  turbopack: {
    // Ensure the correct workspace root to avoid parent lockfile inference
    root: process.cwd(),
  },
  // PostHog reverse proxy: analytics is served first-party from biketime.cz/relay/*
  // instead of eu.i.posthog.com, so ad blockers (which target the posthog.com
  // hostnames) don't drop ~10-25% of events. "/relay" is a neutral path — avoid
  // "ingest"/"analytics"/"posthog" which some blocklists match. The client sets
  // api_host: "/relay"; these rewrites forward to the EU ingestion + asset hosts.
  async rewrites() {
    return [
      {
        source: "/relay/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/relay/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // PostHog hits API paths with trailing slashes; don't let Next.js redirect them.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
