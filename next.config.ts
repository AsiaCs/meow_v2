import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

// Supabase project host is embedded in the CSP connect-src so the browser
// client (auth, DB queries) is allowed to reach it. Falls back to the
// hardcoded project ref used in lib/supabase/config.ts if the env var isn't
// set at build time.
const SUPABASE_HOST = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://eudyxsewszwytjedzrsv.supabase.co"
    ).host
  } catch {
    return "*.supabase.co"
  }
})()

// Content-Security-Policy. 'unsafe-inline' on script-src is required by
// Next.js's inline hydration bootstrap script; styles need it for
// styled-jsx/Tailwind's injected <style> tags. Everything else is locked to
// self + the specific third parties this app actually talks to.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' https://fonts.gstatic.com`,
  `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST} https://challenges.cloudflare.com https://*.sentry.io`,
  `frame-src 'self' https://challenges.cloudflare.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
]

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
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
