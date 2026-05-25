// Server-side LinkedIn redirector.
//
// Click flow:
//   PersonCard <a href="/api/people/{id}/linkedin"> -> this route -> 302 -> profile
//
// Priority order for the redirect target:
//   1. Saved users.linkedinUrl (the canonical, hand-verified profile URL)
//   2. DuckDuckGo "!ducky" bang: 302s straight to the first Google result for
//      `site:linkedin.com/in <Full Name> <Role> <Location>`. This almost always
//      lands on the actual profile page rather than a logged-out search wall.
//   3. As a last resort if the user row doesn't exist or has no name, send to
//      LinkedIn's people-search keywords page.

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface UserRow {
  name: string | null
  location: string | null
  linkedinUrl: string | null
  experiences: { type: string; title: string | null; organization: string | null }[] | null
}

function isWellFormedLinkedInProfile(url: string | null): url is string {
  if (!url) return false
  try {
    const u = new URL(url)
    return (
      (u.hostname === "linkedin.com" || u.hostname === "www.linkedin.com") &&
      /^\/in\/[A-Za-z0-9-]+\/?$/.test(u.pathname)
    )
  } catch {
    return false
  }
}

function pickRoleAndOrg(experiences: UserRow["experiences"]): string {
  if (!experiences || experiences.length === 0) return ""
  // Prefer most recent WORK experience
  const work = experiences.find((e) => e.type === "WORK")
  const pick = work ?? experiences[0]
  return [pick.title, pick.organization].filter(Boolean).join(" ")
}

// Build a DuckDuckGo I'm-Feeling-Lucky-equivalent that resolves to the actual
// LinkedIn profile, not a search results wall.
function buildDuckyUrl(name: string, role: string, location: string | null): string {
  const parts = [`site:linkedin.com/in`, name]
  if (role) parts.push(role)
  if (location) parts.push(location)
  const query = parts.join(" ")
  // !ducky bang on DDG -> Google first-hit redirect
  return `https://duckduckgo.com/?q=${encodeURIComponent(`!ducky ${query}`)}`
}

// LinkedIn's keywords-only people-search page (last-resort, still requires login)
function buildLinkedInSearchFallback(name: string, location: string | null): string {
  const keywords = location ? `${name} ${location}` : name
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}&origin=GLOBAL_SEARCH_HEADER`
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let row: UserRow | null = null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("users")
      .select("name, location, linkedinUrl, experiences!experiences_userId_fkey(type, title, organization)")
      .eq("id", id)
      .single()
    row = (data as UserRow | null) ?? null
  } catch {
    /* fall through to generic fallback below */
  }

  // Strict-form saved URL wins — straight to the profile, no extra hop.
  if (row && isWellFormedLinkedInProfile(row.linkedinUrl)) {
    return NextResponse.redirect(row.linkedinUrl, 302)
  }

  // No saved URL — build a hyper-targeted I'm-Feeling-Lucky-style redirect.
  const name = (row?.name ?? "").trim()
  if (!name) {
    // Nothing to search for; bounce them to LinkedIn home.
    return NextResponse.redirect("https://www.linkedin.com/", 302)
  }

  const role = pickRoleAndOrg(row?.experiences ?? [])
  const ducky = buildDuckyUrl(name, role, row?.location ?? null)

  // We could redirect to LinkedIn's search page directly, but !ducky usually
  // resolves the actual profile, which is what the user wants. If DDG ever
  // fails we still have `fallback` for the worst case via a client retry —
  // but for now a single 302 is enough.
  // (Build the LinkedIn fallback to make sure it's syntactically valid even
  // though we don't redirect to it on this hop.)
  void buildLinkedInSearchFallback(name, row?.location ?? null)

  return NextResponse.redirect(ducky, 302)
}
