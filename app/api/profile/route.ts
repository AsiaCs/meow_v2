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

    let { data, error } = await supabase
      .from("users")
      .select("id, name, email, image, location, interests, onboarded, digestEnabled, experiences(*)")
      .eq("id", user.id)
      .single()

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
      const refetch = await supabase
        .from("users")
        .select("id, name, email, image, location, interests, onboarded, digestEnabled, experiences(*)")
        .eq("id", user.id)
        .single()
      data = refetch.data
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

    // Upsert so a row is created if missing (defense-in-depth for pre-trigger-fix accounts)
    const upsertRow: Record<string, unknown> = {
      id: user.id,
      email: user.email!,
      updatedAt: new Date().toISOString(),
    }
    if (result.data.name !== undefined) upsertRow.name = result.data.name
    if (result.data.location !== undefined) upsertRow.location = result.data.location
    if (result.data.interests !== undefined) upsertRow.interests = result.data.interests
    if (result.data.digestEnabled !== undefined) upsertRow.digestEnabled = result.data.digestEnabled

    const { data, error } = await supabase
      .from("users")
      .upsert(upsertRow, { onConflict: "id", ignoreDuplicates: false })
      .select("id, name, location, interests, image, onboarded, digestEnabled")
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("[profile/PATCH]", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
