// Lightweight concurrent load test (no external deps). Runs against a deployed
// URL. Usage: node scripts/loadtest.mjs https://meow-two-pied.vercel.app [seconds] [concurrency]
//
// Measures per-endpoint latency percentiles, throughput, status distribution,
// and error rate for a realistic read-heavy mix, then does a focused burst on
// the auth endpoint to confirm rate limiting returns 429s.

const BASE = (process.argv[2] || "https://meow-two-pied.vercel.app").replace(/\/$/, "")
const DURATION = Number(process.argv[3] || 30)
const CONCURRENCY = Number(process.argv[4] || 30)

// Read-mix: weighted toward the main data endpoint and landing.
const MIX = [
  { name: "GET /api/events", weight: 5, run: () => fetch(`${BASE}/api/events`) },
  { name: "GET /", weight: 3, run: () => fetch(`${BASE}/`) },
  { name: "GET /internships (auth)", weight: 1, run: () => fetch(`${BASE}/internships`, { redirect: "manual" }) },
  { name: "GET /privacy", weight: 1, run: () => fetch(`${BASE}/privacy`) },
]
const WEIGHTED = MIX.flatMap((m) => Array(m.weight).fill(m))

const stats = {} // name -> { lat: [], codes: {}, errors: 0 }
function record(name, ms, code, err) {
  const s = (stats[name] ??= { lat: [], codes: {}, errors: 0 })
  if (err) { s.errors++; return }
  s.lat.push(ms)
  s.codes[code] = (s.codes[code] || 0) + 1
}
function pct(arr, p) {
  if (!arr.length) return 0
  const a = [...arr].sort((x, y) => x - y)
  return Math.round(a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))])
}

async function worker(deadline) {
  while (Date.now() < deadline) {
    const pick = WEIGHTED[Math.floor((Date.now() * 7 + Math.random() * 1000) % WEIGHTED.length)]
    const t0 = Date.now()
    try {
      const res = await pick.run()
      await res.text()
      record(pick.name, Date.now() - t0, res.status, false)
    } catch {
      record(pick.name, Date.now() - t0, 0, true)
    }
  }
}

async function readMix() {
  console.log(`\n=== READ-MIX LOAD: ${CONCURRENCY} concurrent for ${DURATION}s against ${BASE} ===`)
  const deadline = Date.now() + DURATION * 1000
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(deadline)))

  let total = 0
  for (const [name, s] of Object.entries(stats)) {
    const n = s.lat.length
    total += n + s.errors
    console.log(`\n${name}`)
    console.log(`  requests: ${n}  errors: ${s.errors}`)
    console.log(`  latency ms  p50=${pct(s.lat, 50)}  p95=${pct(s.lat, 95)}  p99=${pct(s.lat, 99)}  max=${pct(s.lat, 100)}`)
    console.log(`  status: ${Object.entries(s.codes).map(([c, v]) => `${c}:${v}`).join("  ")}`)
  }
  console.log(`\n  TOTAL requests: ${total}  (~${Math.round(total / DURATION)} req/s)`)
}

async function authRateLimitProbe() {
  console.log(`\n=== AUTH RATE-LIMIT PROBE: 25 rapid sign-in attempts from one IP ===`)
  const codes = {}
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch(`${BASE}/api/auth/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `probe${i}@example.com`, password: "wrong-password-x", mode: "signin" }),
      })
      codes[res.status] = (codes[res.status] || 0) + 1
    } catch {
      codes["err"] = (codes["err"] || 0) + 1
    }
  }
  console.log(`  status distribution: ${Object.entries(codes).map(([c, v]) => `${c}:${v}`).join("  ")}`)
  console.log(codes["429"] ? "  ✅ rate limiting is ACTIVE (got 429s)" : "  ⚠️ no 429s — Upstash not connected yet, or limit not reached")
}

await readMix()
await authRateLimitProbe()
console.log("\nDone.")
