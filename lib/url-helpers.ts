// URL helpers used by people / events / internships UI to safely render
// external links. Every helper either returns a valid URL or null — callers
// must check and render a disabled state when null.

const URL_PROTOCOL_REGEX = /^https?:\/\//i

export function safeExternalUrl(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null
  if (!URL_PROTOCOL_REGEX.test(trimmed)) return null
  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname.length < 3) return null
    return parsed.toString()
  } catch {
    return null
  }
}

// Strict whitelist: only accept GitHub profile or repo URLs.
// Matches https://github.com/{user} or https://github.com/{user}/{repo}.
const GITHUB_PATH_RE = /^\/[A-Za-z0-9][A-Za-z0-9-]{0,38}(\/[A-Za-z0-9._-]+)?\/?$/
export function isGithubUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    return (
      (u.hostname === "github.com" || u.hostname === "www.github.com") &&
      GITHUB_PATH_RE.test(u.pathname)
    )
  } catch {
    return false
  }
}

// Generic "looks like a portfolio / personal site" check — must be an https
// URL with a real-looking hostname. Used to allow .com / .dev / .me sites
// while rejecting empty strings and protocol-less garbage.
export function isPortfolioUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const safe = safeExternalUrl(url)
  if (!safe) return false
  try {
    const u = new URL(safe)
    // Block well-known social URLs from masquerading as portfolios
    const banned = ["facebook.com", "twitter.com", "x.com", "instagram.com"]
    if (banned.some((d) => u.hostname.endsWith(d))) return false
    return u.hostname.includes(".")
  } catch {
    return false
  }
}

// Picks the best "Proof of Build" URL: GitHub takes priority because we can
// actually verify it (repo activity, public profile). Portfolio is the
// graceful fallback.
export function pickBuildUrl(
  githubUrl: string | null | undefined,
  portfolioUrl: string | null | undefined,
): { url: string; kind: "github" | "portfolio" } | null {
  if (isGithubUrl(githubUrl)) return { url: githubUrl as string, kind: "github" }
  if (isPortfolioUrl(portfolioUrl)) return { url: portfolioUrl as string, kind: "portfolio" }
  return null
}
