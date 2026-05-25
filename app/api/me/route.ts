import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type UserLocationRow = {
  location?: string | null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ location: null })

    const { data } = await supabase
      .from("users")
      .select("location")
      .eq("id", user.id)
      .single()

    return NextResponse.json({ location: (data as UserLocationRow | null)?.location ?? null })
  } catch {
    return NextResponse.json({ location: null })
  }
}
