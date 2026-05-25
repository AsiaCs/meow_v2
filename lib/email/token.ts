import { createHmac, timingSafeEqual } from "node:crypto"

// HMAC-signed user IDs for unsubscribe links. Stateless — we don't need to
// store one-time tokens in the DB. The signing key MUST be in DIGEST_SECRET.

function getSecret(): string {
  const s = process.env.DIGEST_SECRET
  if (!s || s.length < 16) {
    throw new Error("DIGEST_SECRET env var missing or too short (need 16+ chars)")
  }
  return s
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : ""
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64")
}

export function signUserId(userId: string): string {
  const sig = createHmac("sha256", getSecret()).update(userId).digest()
  return `${userId}.${b64url(sig)}`
}

export function verifyUserId(token: string): string | null {
  const dot = token.lastIndexOf(".")
  if (dot < 0) return null
  const userId = token.slice(0, dot)
  const provided = b64urlDecode(token.slice(dot + 1))
  const expected = createHmac("sha256", getSecret()).update(userId).digest()
  if (provided.length !== expected.length) return null
  try {
    if (!timingSafeEqual(provided, expected)) return null
  } catch {
    return null
  }
  return userId
}
