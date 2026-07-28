import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "media.licdn.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cerebralvalley.ai" },
      { protocol: "https", hostname: "lu.ma" },
      { protocol: "https", hostname: "images.lumacdn.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
}

// Wrap with Sentry. Source-map upload is skipped unless SENTRY_AUTH_TOKEN +
// org/project are set — error capture still works without it. tunnelRoute
// routes events through our own domain so ad-blockers don't drop them.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
})
