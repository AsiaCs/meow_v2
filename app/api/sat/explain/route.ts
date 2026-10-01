import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { SUPABASE_URL } from "@/lib/supabase/config"
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit"
import { loadBank, writeExplanation, ExplainError } from "@/lib/sat/explain"

// POST { qid } -> the simple explanation for one SAT question, writing and
// saving it first if nobody has opened that question before.
// Returns 503 when explanations aren't switched on (no ANTHROPIC_API_KEY);
// the ladder then shows the official College Board explanation instead.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!process.env.ANTHROPIC_API_KEY || !serviceKey) {
    return NextResponse.json({ error: "Explanations are not switched on." }, { status: 503 })
  }

  let qid = ""
  try { qid = String((await req.json()).qid ?? "") } catch {}
  if (!/^[0-9a-f]{8}$/.test(qid)) return NextResponse.json({ error: "Bad question id." }, { status: 400 })

  const admin = createServiceClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } })
  const { data: saved } = await admin.from("sat_explanations").select("data").eq("qid", qid).maybeSingle()
  if (saved) return NextResponse.json(saved.data)

  const rl = await checkRateLimit(limiters.sat, `sat-explain:${user.id}`)
  if (!rl.ok) return tooManyRequests(rl.reset)

  try {
    const qs = await loadBank(admin)
    const q = qs.get(qid)
    if (!q) return NextResponse.json({ error: "No such question." }, { status: 404 })
    const x = await writeExplanation(q, qs)
    await admin.from("sat_explanations").upsert({ qid, data: x, created_by: user.id })
    return NextResponse.json(x)
  } catch (e) {
    if (e instanceof ExplainError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error("[sat/explain]", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Couldn't write an explanation." }, { status: 502 })
  }
}
