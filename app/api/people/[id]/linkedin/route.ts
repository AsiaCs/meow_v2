// Server-side LinkedIn redirector + last-mile verifier.
//
// Click flow:
//   PersonCard <a href="/api/people/{id}/linkedin"> -> this route -> 302 -> profile
//
// Priority order for the redirect target:
//   1. linkedinStatus = 'verified' AND well-formed linkedinUrl -> straight to that URL
//   2. Well-formed linkedinUrl that hasn't been confirmed broken yet:
//      run an on-demand verification. If verified or inconclusive -> straight there;
//      if broken -> persist and fall through.
//   3. No usable saved URL -> redirect to LinkedIn's own People-search results,
//      keyword-stuffed with name + most-recent role (+ location). This always
//      resolves to a real LinkedIn page, never a 404.

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"
import { verifyLinkedInProfile, isWellFormedProfileUrl } from "@/lib/linkedin/verify"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface UserRow {
  name: string | null
  location: string | null
  linkedinUrl: string | null
  linkedinStatus: string | null
  experiences: { type: string; title: string | null; organization: string | null }[] | null
}

function pickRoleAndOrg(experiences: UserRow["experiences"]): string {
  if (!experiences || experiences.length === 0) return ""
  const work = experiences.find((e) => e.type === "WORK")
  const pick = work ?? experiences[0]
  return [pick.title, pick.organization].filter(Boolean).join(" ")
}

// LinkedIn-native People search. Spec'd format:
//   /search/results/people/?keywords=Firstname+Lastname+CurrentRole
// This is the high-relevance directory result the user explicitly requested.
function buildLinkedInPeopleSearchUrl(
  name: string,
  role: string,
  location: string | null,
): string {
  const parts = [name]
  if (role) parts.push(role)
  if (location) parts.push(location)
  return (
    "https://www.linkedin.com/search/results/people/?keywords=" +
    encodeURIComponent(parts.join(" ")) +
    "&origin=GLOBAL_SEARCH_HEADER"
  )
}

async function persistStatus(id: string, status: string): Promise<void> {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY
    const sb = createServiceClient(SUPABASE_URL, key, { auth: { persistSession: false } })
    await sb
      .from("users")
      .update({ linkedinStatus: status, linkedinCheckedAt: new Date().toISOString() })
      .eq("id", id)
  } catch {
    // Column might not exist yet — silently skip
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let row: UserRow | null = null
  try {
    const supabase = await createClient()
    const wide = await supabase
      .from("users")
      .select(
        "name, location, linkedinUrl, linkedinStatus, " +
        "experiences!experiences_userId_fkey(type, title, organization)",
      )
      .eq("id", id)
      .single()

    // Supabase returns {data:null, error} on column-missing — does NOT throw.
    if (wide.error && /column .*linkedinStatus.* does not exist/i.test(wide.error.message ?? "")) {
      const narrow = await supabase
        .from("users")
        .select(
          "name, location, linkedinUrl, " +
          "experiences!experiences_userId_fkey(type, title, organization)",
        )
        .eq("id", id)
        .single()
      row = narrow.data
        ? ({
            ...(narrow.data as unknown as Omit<UserRow, "linkedinStatus">),
            linkedinStatus: null,
          } as UserRow)
        : null
    } else {
      row = (wide.data as UserRow | null) ?? null
    }
  } catch { /* swallow — fall through to public-search fallback */ }

  const savedUrl = row?.linkedinUrl ?? null
  const isFormed = isWellFormedProfileUrl(savedUrl)

  // Path 1: already verified → straight through
  if (row?.linkedinStatus === "verified" && isFormed) {
    return NextResponse.redirect(savedUrl as string, 302)
  }

  // Path 2: well-formed URL we haven't confirmed broken → verify on demand
  if (isFormed && row?.linkedinStatus !== "broken") {
    const verdict = await verifyLinkedInProfile(savedUrl as string, { timeoutMs: 5000 })
    // Persist whatever we learned for next time
    if (verdict.status === "verified" || verdict.status === "broken") {
      void persistStatus(id, verdict.status)
    }
    if (verdict.status === "verified" || verdict.status === "inconclusive") {
      return NextResponse.redirect(savedUrl as string, 302)
    }
    // verdict.status === "broken" → fall through to search
  }

  // Path 3: no usable saved URL → LinkedIn-native People search
  const name = (row?.name ?? "").trim()
  if (!name) {
    return NextResponse.redirect("https://www.linkedin.com/", 302)
  }
  const role = pickRoleAndOrg(row?.experiences ?? [])
  const search = buildLinkedInPeopleSearchUrl(name, role, row?.location ?? null)
  return NextResponse.redirect(search, 302)
}
