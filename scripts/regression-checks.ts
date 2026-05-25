import assert from "node:assert/strict"

import { isSpecificApplyUrl, isSpecificEventUrl } from "../lib/validators/specific-urls"
import { buildLinkedInSearchUrl, isLinkedInProfileFormat } from "../lib/url-helpers"
import { normalizeProfileData } from "../lib/profile-normalization"

assert.equal(isSpecificEventUrl("https://lu.ma/sf"), false)
assert.equal(isSpecificEventUrl("https://lu.ma/discover"), false)
assert.equal(isSpecificEventUrl("https://lu.ma/some-specific-startup-night"), true)

assert.equal(isSpecificApplyUrl("https://boards.greenhouse.io/notion"), false)
assert.equal(isSpecificApplyUrl("https://boards.greenhouse.io/anthropic#internships"), false)
assert.equal(isSpecificApplyUrl("https://jobs.ashbyhq.com/linear"), false)
assert.equal(isSpecificApplyUrl("https://jobs.lever.co/cohere?commitment=Intern"), true)

assert.equal(isLinkedInProfileFormat("https://www.linkedin.com/in/aaron-sun"), true)
assert.equal(isLinkedInProfileFormat("https://www.linkedin.com/company/openai"), false)
assert.ok(buildLinkedInSearchUrl("Sophia Chen")?.startsWith("https://www.linkedin.com/search/results/people/"))

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
