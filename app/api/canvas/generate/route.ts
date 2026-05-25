import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

interface GenerateBody {
  prompt: string
}

export async function POST(request: Request) {
  let body: GenerateBody
  try {
    body = (await request.json()) as GenerateBody
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const prompt = body.prompt?.trim()
  if (!prompt) return NextResponse.json({ error: "empty prompt" }, { status: 400 })
  if (prompt.length > 1000)
    return NextResponse.json({ error: "prompt too long" }, { status: 400 })

  // Path A: Replicate (preferred — many model choices, async-friendly)
  const replicateToken = process.env.REPLICATE_API_TOKEN
  if (replicateToken) {
    return runReplicate(prompt, replicateToken)
  }

  // Path B: OpenAI gpt-image-1 (simpler, single key)
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    return runOpenAI(prompt, openaiKey)
  }

  return NextResponse.json(
    {
      error:
        "No image-gen provider configured. Set REPLICATE_API_TOKEN (preferred) or OPENAI_API_KEY in Vercel env vars.",
    },
    { status: 503 },
  )
}

// ───────── Replicate (black-forest-labs/flux-schnell) ─────────
async function runReplicate(prompt: string, token: string) {
  try {
    const created = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=55",
      },
      body: JSON.stringify({
        // FLUX schnell — fast, cheap, good
        version: "black-forest-labs/flux-schnell",
        input: { prompt, aspect_ratio: "1:1", output_format: "webp", output_quality: 85 },
      }),
    })

    const data = (await created.json()) as {
      id?: string
      status?: string
      output?: string | string[]
      error?: string | null
      urls?: { get?: string }
    }

    if (!created.ok) {
      return NextResponse.json(
        { error: `replicate ${created.status}: ${data.error ?? "unknown"}` },
        { status: 502 },
      )
    }

    // If Prefer:wait timed out, poll until done (cap at ~45s)
    let final = data
    if (final.status !== "succeeded" && final.status !== "failed" && final.urls?.get) {
      const deadline = Date.now() + 45_000
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500))
        const poll = await fetch(final.urls!.get!, {
          headers: { Authorization: `Bearer ${token}` },
        })
        final = (await poll.json()) as typeof data
        if (final.status === "succeeded" || final.status === "failed") break
      }
    }

    if (final.status !== "succeeded") {
      return NextResponse.json(
        { error: final.error ?? `replicate status: ${final.status}` },
        { status: 502 },
      )
    }

    const url = Array.isArray(final.output) ? final.output[0] : final.output
    if (!url) return NextResponse.json({ error: "no output from replicate" }, { status: 502 })

    return NextResponse.json({ url, provider: "replicate", model: "flux-schnell" })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "replicate network error" },
      { status: 502 },
    )
  }
}

// ───────── OpenAI gpt-image-1 ─────────
async function runOpenAI(prompt: string, key: string) {
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        n: 1,
      }),
    })

    const data = (await res.json()) as {
      data?: Array<{ b64_json?: string; url?: string }>
      error?: { message?: string }
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message ?? `openai ${res.status}` },
        { status: 502 },
      )
    }

    const first = data.data?.[0]
    if (!first) return NextResponse.json({ error: "no image from openai" }, { status: 502 })

    const url = first.url ?? (first.b64_json ? `data:image/png;base64,${first.b64_json}` : null)
    if (!url) return NextResponse.json({ error: "no url/b64 in response" }, { status: 502 })

    return NextResponse.json({ url, provider: "openai", model: "gpt-image-1" })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "openai network error" },
      { status: 502 },
    )
  }
}
