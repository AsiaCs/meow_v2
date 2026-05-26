import assert from "node:assert/strict"

import { isSpecificApplyUrl, isSpecificEventUrl } from "../lib/validators/specific-urls"
import { isGithubUrl, isPortfolioUrl, pickBuildUrl } from "../lib/url-helpers"
import { normalizeProfileData } from "../lib/profile-normalization"

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

const profile = normalizeProfileData({
  id: "user-1",
  name: "Aaron",
  email: "aaron@example.com",
  interests: null,
  experiences: [{ id: "exp-1", type: "WORK", title: "Intern", current: true, skills: null }],
})

assert.deepEqual(profile.interests, [])
assert.deepEqual(profile.experiences[0].skills, [])

console.log("regression checks passed")
