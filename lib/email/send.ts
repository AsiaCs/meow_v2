// Thin Resend wrapper. No SDK import — keeps the cold start tight and avoids
// pulling a transitive dependency into Edge bundles.

export interface SendArgs {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface SendResult {
  ok: boolean
  id?: string
  error?: string
  skipped?: boolean
}

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.DIGEST_FROM ?? "meow <onboarding@resend.dev>"
  if (!key) return { ok: false, skipped: true, error: "RESEND_API_KEY not set" }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
        reply_to: args.replyTo,
      }),
    })
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string }
    if (!res.ok) {
      return { ok: false, error: data.message ?? `resend ${res.status}` }
    }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" }
  }
}
