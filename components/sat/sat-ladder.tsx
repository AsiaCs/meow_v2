"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { mountLadder } from "@/lib/sat/ladder"
import "./ladder.css"

// Mounts the SAT Reading & Writing Ladder. The ladder renders its own DOM
// (see lib/sat/ladder.js); React only owns the container and its lifetime.
export default function SatLadder({ user }: { user: { id: string; email: string | null } }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    return mountLadder(ref.current, { supabase: createClient(), user })
  }, [user])

  return <div ref={ref} className="sat-ladder" />
}
