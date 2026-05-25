import { createClient as createServiceClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"
import { verifyUserId } from "@/lib/email/token"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function htmlPage(message: string, success: boolean): Response {
  const color = success ? "#22c55e" : "#ef4444"
  const body = `<!doctype html>
<html><head><meta charset="utf-8"><title>meow — unsubscribe</title></head>
<body style="margin:0;background:#0a0a0c;color:#f4f4f5;font-family:-apple-system,Segoe UI,sans-serif">
  <div style="max-width:520px;margin:80px auto;padding:32px;background:#16161a;border:1px solid #232328;border-radius:16px;text-align:center">
    <div style="font:700 24px/1 -apple-system,Segoe UI,sans-serif;background:linear-gradient(135deg,#7c3aed,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:24px">meow</div>
    <p style="font-size:16px;color:${color};margin:0 0 16px 0">${message}</p>
    <a href="/" style="display:inline-block;margin-top:16px;color:#a1a1aa;text-decoration:none;font-size:13px">← back to meow</a>
  </div>
</body></html>`
  return new Response(body, {
    status: success ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")
    if (!token) return htmlPage("Missing unsubscribe token.", false)

    const userId = verifyUserId(token)
    if (!userId) return htmlPage("Invalid or expired unsubscribe link.", false)

    // Service role required because the user isn't authenticated to flip their
    // own column in this context. Falls back to anon for dev/no-RLS setups.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY
    const client = createServiceClient(SUPABASE_URL, serviceKey, {
      auth: { persistSession: false },
    })

    const { error } = await client
      .from("users")
      .update({ digestEnabled: false, updatedAt: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      console.error("[digest/unsubscribe]", error)
      return htmlPage("Could not update your preferences. Please try again.", false)
    }

    return htmlPage("You're unsubscribed from the weekly digest.", true)
  } catch (e) {
    console.error("[digest/unsubscribe]", e)
    return htmlPage("Something went wrong.", false)
  }
}
