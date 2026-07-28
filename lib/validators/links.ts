// Domains where individual pages are expensive or unreliable to check. Keep
// this list tiny: event and job platforms can return valid homepages while
// specific listings are 404, so those must be checked per URL.
const TRUSTED_DOMAINS = [
  "stripe.com",
  "databricks.com",
  "goldmansachs.com",
  "notion.com",
  "vercel.com",
  // CV events come straight from the CV API — the events on its site are
  // the source of truth, so HEAD-checking them just adds latency.
  "cerebralvalley.ai",
  // Partiful HEAD-checks are unreliable (some events return 403 to bots).
  "partiful.com",
]

function isTrusted(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return TRUSTED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))
  } catch {
    return false
  }
}

// SSRF guard. Only allow http/https to public hosts; reject localhost, private
// and link-local ranges (incl. the cloud metadata IP 169.254.169.254), and
// literal internal IPs. This is a best-effort defense — it blocks direct
// internal targets. Callers still pass server-controlled URLs (scraper/admin),
// so this is defense-in-depth, not the primary control. Note: it does not
// re-check the target of an HTTP redirect, so we keep the trusted-source model.
function isSafePublicUrl(url: string): boolean {
  let parsed: URL
  try { parsed = new URL(url) } catch { return false }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) return false
  // IPv6 loopback / unique-local / link-local
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return false

  // IPv4 literal → block private / loopback / link-local / reserved ranges
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    if (a === 10 || a === 127 || a === 0) return false
    if (a === 169 && b === 254) return false            // link-local + metadata
    if (a === 172 && b >= 16 && b <= 31) return false   // 172.16/12
    if (a === 192 && b === 168) return false            // 192.168/16
    if (a === 100 && b >= 64 && b <= 127) return false  // CGNAT 100.64/10
    if (a >= 224) return false                          // multicast / reserved
  }
  return true
}

export async function isLinkReachable(url: string, timeoutMs = 5000): Promise<boolean> {
  if (!url) return false
  try { new URL(url) } catch { return false }
  if (!isSafePublicUrl(url)) return false
  if (isTrusted(url)) return true

  const headers = { "User-Agent": "Mozilla/5.0 (compatible; Meow-Bot/1.0)" }

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers,
      redirect: "follow",
    })
    clearTimeout(id)
    if (res.status < 400) return true
    if (res.status !== 405) return false
  } catch {
    // Some event/job boards block HEAD. Fall through to a small GET probe.
  }

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers,
      redirect: "follow",
    })
    clearTimeout(id)
    return res.status < 400
  } catch {
    return false
  }
}

export async function filterReachable<T>(
  items: T[],
  getUrl: (item: T) => string | undefined,
  concurrency = 6,
): Promise<T[]> {
  const valid: T[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const settled = await Promise.allSettled(
      batch.map(async (item) => {
        const url = getUrl(item)
        if (!url) return item
        const ok = await isLinkReachable(url)
        return ok ? item : null
      }),
    )
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value !== null) valid.push(r.value as T)
    }
  }
  return valid
}
