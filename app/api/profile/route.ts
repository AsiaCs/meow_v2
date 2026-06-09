import { NextResponse } from "next/server"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"
import { normalizeProfileData } from "@/lib/profile-normalization"

type ProfileRow = {
  email?: string | null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const WIDE = "id, name, email, image, location, interests, onboarded, digestEnabled, githubUrl, portfolioUrl, experiences(*)"
    const NARROW = "id, name, email, image, location, interests, onboarded, experiences(*)"
    let { data, error } = await supabase
      .from("users")
      .select(WIDE)
      .eq("id", user.id)
      .single()

    // Graceful fallback if new columns aren't migrated yet
    if (error && /column .* does not exist/i.test(error.message ?? "")) {
      const refetch = await supabase
        .from("users")
        .select(NARROW)
        .eq("id", user.id)
        .single()
      data = refetch.data as unknown as typeof data
      error = refetch.error
    }

    // Auto-bootstrap: if the auth user exists but the public.users row does
    // not, create it on the fly. Happens for accounts signed up before the
    // handle_new_user trigger was fixed.
    if (error || !data) {
      const { error: insertErr } = await supabase
        .from("users")
        .upsert(
          {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name ?? null,
            image: user.user_metadata?.avatar_url ?? null,
            interests: [],
            onboarded: false,
            updatedAt: new Date().toISOString(),
          },
          { onConflict: "id", ignoreDuplicates: false },
        )
      if (insertErr) {
        console.error("[profile/GET] bootstrap failed", insertErr.message)
        // Still return a minimal stable shape so the client renders something
        return NextResponse.json(
          normalizeProfileData({
            id: user.id,
            email: user.email ?? null,
            name: user.user_metadata?.full_name ?? null,
            image: user.user_metadata?.avatar_url ?? null,
            interests: [],
            experiences: [],
          }),
        )
      }
      // Re-read after upsert so we get the canonical row
      let refetch = await supabase
        .from("users")
        .select(WIDE)
        .eq("id", user.id)
        .single()
      if (refetch.error && /column .* does not exist/i.test(refetch.error.message ?? "")) {
        refetch = await supabase
          .from("users")
          .select(NARROW)
          .eq("id", user.id)
          .single()
      }
      data = refetch.data as unknown as typeof data
    }

    // Always return a stable shape — interests/experiences default to [] so the
    // client never has to defend against undefined.
    const shaped = normalizeProfileData({
      ...data,
      email: (data as ProfileRow)?.email ?? user.email ?? null,
    })
    return NextResponse.json(shaped)
  } catch (error) {
    console.error("[profile/GET]", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z.string().max(100).optional(),
  interests: z.array(z.string()).optional(),
  digestEnabled: z.boolean().optional(),
  // Proof-of-Build links. Plain string so users can paste with or without https.
  githubUrl: z.string().max(200).optional().nullable(),
  portfolioUrl: z.string().max(200).optional().nullable(),
  // Coordination handles. Plain text — users enter @handles or emails directly.
})

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const result = profileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", issues: result.error.issues }, { status: 400 })
    }

    // Step 1: try to UPDATE the existing row with only the changed columns.
    // This is the safest path under RLS — most policies allow update on own row.
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (result.data.name !== undefined) updateData.name = result.data.name
    if (result.data.location !== undefined) updateData.location = result.data.location
    if (result.data.interests !== undefined) updateData.interests = result.data.interests
    if (result.data.digestEnabled !== undefined) updateData.digestEnabled = result.data.digestEnabled
    if (result.data.githubUrl !== undefined) updateData.githubUrl = result.data.githubUrl || null
    if (result.data.portfolioUrl !== undefined) updateData.portfolioUrl = result.data.portfolioUrl || null

    const updateRes = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select("id, name, location, interests, image, onboarded, digestEnabled")

    // If a row matched, we're done.
    if (!updateRes.error && Array.isArray(updateRes.data) && updateRes.data.length > 0) {
      return NextResponse.json(updateRes.data[0])
    }

    // If updatedAt or digestEnabled doesn't exist as a column, retry without them.
    if (updateRes.error && /column .* does not exist/i.test(updateRes.error.message)) {
      const safe = { ...updateData }
      delete safe.updatedAt
      delete safe.digestEnabled
      const retry = await supabase
        .from("users")
        .update(safe)
        .eq("id", user.id)
        .select("id, name, location, interests, image, onboarded")
      if (!retry.error && Array.isArray(retry.data) && retry.data.length > 0) {
        return NextResponse.json(retry.data[0])
      }
      if (retry.error) {
        return NextResponse.json(
          { error: `Update failed: ${retry.error.message}` },
          { status: 500 },
        )
      }
    }

    if (updateRes.error) {
      return NextResponse.json(
        { error: `Update failed: ${updateRes.error.message}` },
        { status: 500 },
      )
    }

    // Step 2: no row matched — bootstrap with insert
    const insertRow: Record<string, unknown> = {
      id: user.id,
      email: user.email!,
      name: result.data.name ?? user.user_metadata?.full_name ?? null,
      image: user.user_metadata?.avatar_url ?? null,
      interests: result.data.interests ?? [],
      location: result.data.location ?? null,
      onboarded: false,
    }
    const insertRes = await supabase
      .from("users")
      .insert(insertRow)
      .select("id, name, location, interests, image, onboarded")
      .single()
    if (insertRes.error) {
      return NextResponse.json(
        { error: `Bootstrap insert failed: ${insertRes.error.message}` },
        { status: 500 },
      )
    }
    return NextResponse.json(insertRes.data)
  } catch (error) {
    console.error("[profile/PATCH]", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
