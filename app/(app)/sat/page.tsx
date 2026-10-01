import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import SatLadder from "@/components/sat/sat-ladder"

export const metadata: Metadata = {
  title: "SAT Reading & Writing Ladder",
}

export default async function SatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/signin")

  return <SatLadder user={{ id: user.id, email: user.email ?? null }} />
}
