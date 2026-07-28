import type { ErrorEvent } from "@sentry/nextjs"

// Strip anything sensitive before an event leaves the process. We never want
// passwords, tokens, cookies, auth headers, raw request bodies, emails, or IPs
// in Sentry. This runs in beforeSend on server, edge, and client.
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    // Cookies carry the Supabase session — never send them.
    delete event.request.cookies
    if (event.request.headers) {
      for (const k of Object.keys(event.request.headers)) {
        if (/cookie|authorization|x-api-key|apikey/i.test(k)) {
          delete event.request.headers[k]
        }
      }
    }
    // Request bodies may contain passwords / PII — don't ship them.
    if (event.request.data) event.request.data = "[stripped]"
    // Query strings can leak tokens.
    if (event.request.query_string) event.request.query_string = "[stripped]"
  }

  // Keep a user id for debugging, but drop directly-identifying fields.
  if (event.user) {
    delete event.user.email
    delete event.user.ip_address
    delete event.user.username
  }

  // Belt-and-suspenders: redact obviously-sensitive keys from extra/contexts.
  const redactKeys = (obj: Record<string, unknown> | undefined) => {
    if (!obj) return
    for (const k of Object.keys(obj)) {
      if (/pass(word)?|token|secret|authorization|cookie|api[_-]?key|refresh|jwt/i.test(k)) {
        obj[k] = "[redacted]"
      }
    }
  }
  redactKeys(event.extra as Record<string, unknown> | undefined)
  if (event.contexts) {
    for (const ctx of Object.values(event.contexts)) {
      redactKeys(ctx as Record<string, unknown> | undefined)
    }
  }

  return event
}
