import * as Sentry from "@sentry/nextjs"
import { scrubEvent } from "@/lib/sentry-scrub"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  // No session replay — avoids capturing user screens/inputs (privacy + cost).
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  beforeSend: (event) => scrubEvent(event),
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
