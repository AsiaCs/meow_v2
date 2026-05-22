// Domains where HEAD requests are blocked or unreliable. We trust these without
// checking. Lu.ma and LinkedIn are NOT here — we must actually verify those
// because broken event/profile URLs are the #1 source of user pain.
const TRUSTED_DOMAINS = [
  "greenhouse.io",
  "boards.greenhouse.io",
  "lever.co",
  "jobs.lever.co",
  "ashbyhq.com",
  "jobs.ashbyhq.com",
  "workdayjobs.com",
  "myworkdayjobs.com",
  "stripe.com",
  "vercel.com",
  "figma.com",
  "databricks.com",
  "goldmansachs.com",
  "a16z.com",
  "notion.so",
  "ramp.com",
  "cohere.com",
  "eventbrite.com",
  "meetup.com",
  "wellfound.com",
  "ycombinator.com",
  "cerebralvalley.ai",
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

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Meow-Bot/1.0)" },
      redirect: "follow",
    })
    clearTimeout(id)
    // 405 = HEAD not allowed but server exists; anything <400 is fine
    return res.status < 400 || res.status === 405
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
