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

export async function isLinkReachable(url: string, timeoutMs = 5000): Promise<boolean> {
  if (!url) return false
  try { new URL(url) } catch { return false }
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
