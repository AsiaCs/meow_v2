// User toggles their per-event coordination opt-in.
// GET  — returns the current user's wantsToCoordinate for this event
// POST — body { wants: boolean } sets it (upsert on (userId, eventId))

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TABLE = "event_coordinations"

async function ensureSchemaHint(): Promise<{ ok: boolean; hint?: string }> {
  // Caller handles missing-table errors with a clear message — see SQL doc in
  // the commit body. We don't try to auto-create the table.
  return { ok: true }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ wants: false, authenticated: false })

  const { data, error } = await supabase
    .from(TABLE)
    .select("wantsToCoordinate")
    .eq("userId", user.id)
    .eq("eventId", eventId)
    .maybeSingle()

  if (error && /relation .* does not exist/i.test(error.message ?? "")) {
    return NextResponse.json({ wants: false, schemaMissing: true })
  }
  return NextResponse.json({ wants: Boolean(data?.wantsToCoordinate), authenticated: true })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params
  await ensureSchemaHint()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let body: { wants?: unknown }
  try {
    body = (await req.json()) as { wants?: unknown }
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }
  if (typeof body.wants !== "boolean") {
    return NextResponse.json({ error: "wants must be boolean" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        userId: user.id,
        eventId,
        wantsToCoordinate: body.wants,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: "userId,eventId" },
    )
    .select("wantsToCoordinate")
    .single()

  if (error) {
    if (/relation .* does not exist/i.test(error.message ?? "")) {
      return NextResponse.json(
        {
          error: "event_coordinations table not yet created — run the SQL migration",
          schemaMissing: true,
        },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ wants: Boolean(data?.wantsToCoordinate), authenticated: true })
}
