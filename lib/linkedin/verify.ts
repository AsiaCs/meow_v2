// LinkedIn profile verification — the gatekeeper.
//
// Constraint we cannot engineer around: LinkedIn aggressively blocks bots.
// A plain fetch from a Vercel serverless function will usually get either a
// 999 status or a 403 with an empty body, even for URLs that resolve fine
// in a real browser. So the verifier returns four states, not two:
//
//   "verified"      — strong positive signal (HTTP 2xx + profile signature
//                     in the body OR Browserless render confirms the page)
//   "broken"        — HTTP 4xx OR body contains LinkedIn's not-found marker
//   "inconclusive"  — bot-blocked / network error / ambiguous response.
//                     We don't filter these out; we fall back to the safe
//                     People-search redirect for them.
//   "skipped"       — URL is malformed or empty
//
// Caller (e.g. /api/people GET) treats "broken" as the only state that
// should be hidden from the dashboard.

export type VerifyStatus = "verified" | "broken" | "inconclusive" | "skipped"

export interface VerifyResult {
  status: VerifyStatus
  httpStatus?: number
  reason?: string
  via: "headers" | "browserless" | "skip"
}

const PROFILE_PATH_RE = /^\/in\/[A-Za-z0-9-]+\/?$/

export function isWellFormedProfileUrl(url: string | null | undefined): url is string {
  if (!url) return false
  try {
    const u = new URL(url)
    return (
      (u.hostname === "linkedin.com" || u.hostname === "www.linkedin.com") &&
      PROFILE_PATH_RE.test(u.pathname)
    )
  } catch {
    return false
  }
}

// Strings LinkedIn renders in its "this profile does not exist" page body.
// Conservative — only marks broken on high-confidence matches.
const NOT_FOUND_BODY_MARKERS = [
  "this page doesn’t exist",       // curly apostrophe
  "this page doesn't exist",       // straight apostrophe
  "this profile is not available",
  "page not found",
  ">404<",
]

// Browser-class headers — gets us past the simplest bot checks. LinkedIn
// will still 999 on a Vercel datacenter IP, so the inconclusive path is
// the realistic outcome for unauthenticated checks.
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9," +
    "image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
}

interface VerifyOptions {
  timeoutMs?: number
}

// Plain fetch path. Cheap, fast, but LinkedIn often blocks.
async function verifyWithHeaders(url: string, opts: VerifyOptions = {}): Promise<VerifyResult> {
  const timeoutMs = opts.timeoutMs ?? 6000
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: ctrl.signal,
    })

    if (res.status === 404) {
      return { status: "broken", httpStatus: 404, via: "headers", reason: "404" }
    }
    if (res.status >= 400 && res.status < 500 && res.status !== 999) {
      // 401/403/410 — usually auth-wall or bot-block, NOT a missing profile
      return {
        status: "inconclusive",
        httpStatus: res.status,
        via: "headers",
        reason: "bot-blocked or auth-walled",
      }
    }
    if (res.status === 999) {
      return { status: "inconclusive", httpStatus: 999, via: "headers", reason: "linkedin bot block" }
    }

    if (res.status >= 200 && res.status < 300) {
      // Read up to 200KB of body to look for the not-found markers
      const body = (await res.text()).slice(0, 200_000).toLowerCase()
      for (const marker of NOT_FOUND_BODY_MARKERS) {
        if (body.includes(marker)) {
          return {
            status: "broken",
            httpStatus: res.status,
            via: "headers",
            reason: `body marker: ${marker}`,
          }
        }
      }
      // Positive signature — a real LinkedIn profile page renders these
      const hasProfileSig =
        body.includes('"@type":"person"') ||
        body.includes('property="og:type" content="profile"') ||
        body.includes("profile-card") ||
        body.includes("public_profile") ||
        body.includes('"publicidentifier"')
      if (hasProfileSig) {
        return { status: "verified", httpStatus: res.status, via: "headers" }
      }
      // 200 without either signal — likely an authwall page. Inconclusive.
      return {
        status: "inconclusive",
        httpStatus: res.status,
        via: "headers",
        reason: "no profile signature, no not-found marker",
      }
    }

    return {
      status: "inconclusive",
      httpStatus: res.status,
      via: "headers",
      reason: `unexpected status ${res.status}`,
    }
  } catch (e) {
    return {
      status: "inconclusive",
      via: "headers",
      reason: e instanceof Error ? e.message : "network",
    }
  } finally {
    clearTimeout(t)
  }
}

// Browserless path. Optional. Uses a real headless Chrome via the
// Browserless cloud service — set BROWSERLESS_API_KEY to enable.
// docs: https://docs.browserless.io/HTTP-APIs/content
async function verifyWithBrowserless(url: string, opts: VerifyOptions = {}): Promise<VerifyResult> {
  const token = process.env.BROWSERLESS_API_KEY
  if (!token) return { status: "inconclusive", via: "skip", reason: "no BROWSERLESS_API_KEY" }

  const timeoutMs = opts.timeoutMs ?? 15_000
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)

  try {
    const res = await fetch(
      `https://chrome.browserless.io/content?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          gotoOptions: { waitUntil: "networkidle2", timeout: timeoutMs - 1000 },
        }),
        signal: ctrl.signal,
      },
    )
    if (res.status === 400 || res.status === 404) {
      return { status: "broken", httpStatus: res.status, via: "browserless", reason: String(res.status) }
    }
    if (!res.ok) {
      return { status: "inconclusive", httpStatus: res.status, via: "browserless" }
    }
    const body = (await res.text()).slice(0, 400_000).toLowerCase()
    for (const marker of NOT_FOUND_BODY_MARKERS) {
      if (body.includes(marker)) {
        return { status: "broken", via: "browserless", reason: `marker: ${marker}` }
      }
    }
    if (body.includes('"publicidentifier"') || body.includes("profile-photo-edit")) {
      return { status: "verified", via: "browserless" }
    }
    return { status: "inconclusive", via: "browserless", reason: "no positive signature" }
  } catch (e) {
    return {
      status: "inconclusive",
      via: "browserless",
      reason: e instanceof Error ? e.message : "network",
    }
  } finally {
    clearTimeout(t)
  }
}

/** Public verifier. Tries headers first, escalates to Browserless on inconclusive. */
export async function verifyLinkedInProfile(
  url: string | null | undefined,
  opts: VerifyOptions = {},
): Promise<VerifyResult> {
  if (!isWellFormedProfileUrl(url)) {
    return { status: "skipped", via: "skip", reason: "malformed or empty url" }
  }

  const headers = await verifyWithHeaders(url, opts)
  if (headers.status === "verified" || headers.status === "broken") return headers

  // Inconclusive — try Browserless if configured
  if (process.env.BROWSERLESS_API_KEY) {
    const browser = await verifyWithBrowserless(url, opts)
    if (browser.status !== "inconclusive") return browser
  }
  return headers
}

// Bounded concurrency runner for batch verification.
export async function verifyMany<T>(
  items: T[],
  getUrl: (t: T) => string | null | undefined,
  concurrency = 4,
  opts: VerifyOptions = {},
): Promise<Array<{ item: T; result: VerifyResult }>> {
  const out: Array<{ item: T; result: VerifyResult }> = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const settled = await Promise.all(
      batch.map(async (item) => ({ item, result: await verifyLinkedInProfile(getUrl(item), opts) })),
    )
    out.push(...settled)
  }
  return out
}
