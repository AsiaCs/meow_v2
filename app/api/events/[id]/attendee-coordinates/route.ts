// Returns the list of opted-in attendees for a given event, with their
// public coordination handles (Telegram / Discord / email).
//
// Authorization rule: caller must themselves be opted in for this event.
// You can only see other coordinators if you're one too — keeps the data
// reciprocal and prevents passive lurking.

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface CoordinationRow {
  userId: string
  users: {
    id: string
    name: string | null
    image: string | null
    location: string | null
    email: string | null
    telegramHandle: string | null
    discordHandle: string | null
  } | null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  // 1. Confirm the caller is themselves opted in for this event
  const self = await supabase
    .from("event_coordinations")
    .select("wantsToCoordinate")
    .eq("userId", user.id)
    .eq("eventId", eventId)
    .maybeSingle()

  if (self.error) {
    if (/relation .* does not exist/i.test(self.error.message ?? "")) {
      return NextResponse.json(
        { error: "event_coordinations table not yet created", schemaMissing: true },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: self.error.message }, { status: 500 })
  }
  if (!self.data?.wantsToCoordinate) {
    return NextResponse.json(
      {
        error: "Opt in to coordinate first to see other opted-in attendees.",
        attendees: [],
      },
      { status: 403 },
    )
  }

  // 2. Fetch everyone else who opted in for this event + their handles
  const { data, error } = await supabase
    .from("event_coordinations")
    .select(
      `userId,
       users:userId(id, name, image, location, email, telegramHandle, discordHandle)`,
    )
    .eq("eventId", eventId)
    .eq("wantsToCoordinate", true)
    .neq("userId", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as unknown as CoordinationRow[]
  const attendees = rows
    .filter((r) => !!r.users)
    .map((r) => {
      const u = r.users!
      // Only expose handles the user actually provided — never email by default,
      // since that's a stronger reveal. Email shows only if no other channel is set.
      const tg = u.telegramHandle?.trim() ?? null
      const dc = u.discordHandle?.trim() ?? null
      const showEmail = !tg && !dc
      return {
        id: u.id,
        name: u.name,
        image: u.image,
        location: u.location,
        telegram: tg,
        discord: dc,
        email: showEmail ? u.email : null,
      }
    })

  return NextResponse.json({ attendees })
}
