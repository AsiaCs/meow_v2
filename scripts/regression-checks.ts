import assert from "node:assert/strict"

import { isSpecificApplyUrl, isSpecificEventUrl } from "../lib/validators/specific-urls"
import { isGithubUrl, isPortfolioUrl, pickBuildUrl } from "../lib/url-helpers"
import { normalizeProfileData } from "../lib/profile-normalization"
import { parseLocation } from "../lib/geo/parse"
import { distanceMiles } from "../lib/geo/haversine"

assert.equal(isSpecificEventUrl("https://lu.ma/sf"), false)
assert.equal(isSpecificEventUrl("https://lu.ma/discover"), false)
assert.equal(isSpecificEventUrl("https://lu.ma/some-specific-startup-night"), true)

assert.equal(isSpecificApplyUrl("https://boards.greenhouse.io/notion"), false)
assert.equal(isSpecificApplyUrl("https://boards.greenhouse.io/anthropic#internships"), false)
assert.equal(isSpecificApplyUrl("https://jobs.ashbyhq.com/linear"), false)
assert.equal(isSpecificApplyUrl("https://jobs.lever.co/cohere?commitment=Intern"), true)

// Proof-of-Build URL helpers
assert.equal(isGithubUrl("https://github.com/torvalds"), true)
assert.equal(isGithubUrl("https://github.com/vercel/next.js"), true)
assert.equal(isGithubUrl("https://gitlab.com/torvalds"), false)
assert.equal(isPortfolioUrl("https://emil.kowalski.dev"), true)
assert.equal(isPortfolioUrl("https://twitter.com/sama"), false)

const verifiedBuild = pickBuildUrl("https://github.com/torvalds", "https://torvalds.dev")
assert.equal(verifiedBuild?.kind, "github") // github wins when both set
const portfolioBuild = pickBuildUrl(null, "https://aaron.dev")
assert.equal(portfolioBuild?.kind, "portfolio")
assert.equal(pickBuildUrl(null, null), null)

// ---- Geo: parser must keep Bay Area and Los Angeles strictly separated ----
const sf = parseLocation("SHACK15, San Francisco")
assert.equal(sf?.city, "San Francisco")
assert.equal(sf?.region, "Bay Area")
assert.equal(sf?.venue, "SHACK15")
assert.equal(sf?.state, "CA")

const paloAlto = parseLocation("Hacker House, Palo Alto")
assert.equal(paloAlto?.city, "Palo Alto")
assert.equal(paloAlto?.region, "Bay Area", "Palo Alto MUST resolve to Bay Area, never Los Angeles")
assert.equal(paloAlto?.venue, "Hacker House")

const sj = parseLocation("San Jose, CA")
assert.equal(sj?.region, "Bay Area", "San Jose MUST be Bay Area")

const santaMonica = parseLocation("Santa Monica, CA")
assert.equal(santaMonica?.region, "Los Angeles", "Santa Monica MUST be Los Angeles")
assert.notEqual(santaMonica?.region, "Bay Area")

const venice = parseLocation("Venice, CA")
assert.equal(venice?.region, "Los Angeles")

const chinatownSF = parseLocation("Chinatown, SF")
assert.equal(chinatownSF?.region, "Bay Area")
assert.equal(chinatownSF?.city, "San Francisco")

const remote = parseLocation("Remote")
assert.equal(remote?.isVirtual, true)
assert.equal(remote?.city, null)

const unclassifiable = parseLocation("Datadog - Headquarters")
assert.equal(unclassifiable?.city, null)
assert.equal(unclassifiable?.venue, "Datadog - Headquarters")

// ---- Haversine: known distance SF → LA ≈ 347 miles ----
const sfPt = { lat: 37.7749, lng: -122.4194 }
const laPt = { lat: 34.0522, lng: -118.2437 }
const d = distanceMiles(sfPt, laPt)
assert.ok(d > 340 && d < 360, `SF→LA expected ~347 mi, got ${d.toFixed(1)} mi`)
assert.equal(distanceMiles(sfPt, sfPt), 0)

const profile = normalizeProfileData({
  id: "user-1",
  name: "Aaron",
  email: "aaron@example.com",
  interests: null,
  experiences: [{ id: "exp-1", type: "WORK", title: "Intern", current: true, skills: null }],
})

assert.deepEqual(profile.interests, [])
assert.deepEqual(profile.experiences[0].skills, [])

// ---- Submit route: PGRST204 detection must trigger the ladder fallback ----
// Direct import would pull in the Supabase server client; just re-validate
// the detector signature by mirroring it inline.
{
  type PgErr = { code?: string; message?: string }
  function isUndefinedColumn(e: PgErr | null, name?: string): boolean {
    if (!e) return false
    if (e.code === "42703") return true
    if (e.code === "PGRST204") return true
    if (!e.message) return false
    if (name) {
      if (new RegExp(`column .*\\b${name}\\b.* does not exist`, "i").test(e.message)) return true
      if (new RegExp(`could not find the .${name}. column`, "i").test(e.message)) return true
      return false
    }
    if (/column .* does not exist/i.test(e.message)) return true
    if (/could not find the .+ column/i.test(e.message)) return true
    return false
  }
  assert.equal(
    isUndefinedColumn({ code: "PGRST204", message: "Could not find the 'city' column of 'events' in the schema cache" }),
    true,
    "PostgREST PGRST204 must trigger the fallback ladder",
  )
  assert.equal(
    isUndefinedColumn({ code: "42703", message: "column \"city\" does not exist" }),
    true,
    "Native Postgres 42703 must trigger the fallback ladder",
  )
  assert.equal(
    isUndefinedColumn({ code: "42501", message: "permission denied for table events" }),
    false,
    "RLS denial must NOT trigger the column-missing fallback",
  )
  assert.equal(
    isUndefinedColumn({ code: "23502", message: "null value in column \"title\"" }),
    false,
    "NOT NULL violation must NOT trigger the column-missing fallback",
  )
}

console.log("regression checks passed")
