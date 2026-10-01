import Anthropic from "@anthropic-ai/sdk"
import type { SupabaseClient } from "@supabase/supabase-js"

// Writes the short, plain-language explanation the ladder shows after a
// question. Each question is explained once; the result is saved to
// sat_explanations and shared by every student.

const MODEL = "claude-opus-5-5"

export type Question = {
  id: string
  skill: string
  passage: string[]
  prompt: string
  choices: string[]
  answer: string
  rationale: string[]
  fig?: string
  simple?: Explanation
}

export type Explanation = {
  rule: string
  why: string
  traps: Record<string, string>
  next: string[]
}

let bank: Map<string, Question> | null = null // kept while the server instance is warm

export async function loadBank(admin: SupabaseClient): Promise<Map<string, Question>> {
  if (bank) return bank
  const { data, error } = await admin.storage.from("sat-bank").download("qs.json")
  if (error || !data) throw new Error("SAT question bank is missing from storage")
  const qs = JSON.parse(await data.text()) as Question[]
  bank = new Map(qs.map((q) => [q.id, q]))
  return bank
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " ", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…",
}

function plain(h: string): string {
  return String(h)
    .replace(/<br\s*\/?>/g, "\n").replace(/<u>/g, "[").replace(/<\/u>/g, "]")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#?\w+);/g, (m, e: string) => ENTITIES[e] ?? m)
}

const wrongLetters = (q: Question) => "ABCD".split("").filter((L) => L !== q.answer)

function buildPrompt(q: Question, ex?: Explanation, ex2?: Explanation): string {
  return `Rewrite an SAT Reading and Writing answer explanation for a high school student. The official explanations are too long and wordy for them. Your version must be short, plain and practical.

Rules:
- Short everyday words. Each sentence 25 words or fewer.
- Point to the exact clue in the text (quote a few words if useful).
- Never use official phrasing like "the convention being tested", "most logically completes", "best answer because", "conforms to", "rhetorically".
- "rule": 2-5 words naming the rule or question type (e.g. "Subject-verb agreement", "Transition: contrast", "Words in context").
- "why": 1-2 sentences on why the correct answer is right.
- "traps": one sentence for EACH wrong letter saying exactly why it is wrong (the trap).
- "next": 1-3 short, concrete steps the student can do on the next question of this type.

Example 1 output (a subject-verb agreement question, answer B):
${JSON.stringify(ex)}

Example 2 output (a transitions question, answer B):
${JSON.stringify(ex2)}

Now do this question.
Skill: ${q.skill}
Passage:
${plain(q.passage.join("\n"))}${q.fig ? "\n[The question also shows a graph or table; the official explanation below describes its data.]" : ""}
Question: ${plain(q.prompt)}
${q.choices.map((c, i) => "ABCD"[i] + ") " + plain(c)).join("\n")}
Correct answer: ${q.answer}
Wrong letters to cover in "traps": ${wrongLetters(q).join(", ")}

Official explanation (use it for accuracy only, never copy its style):
${plain(q.rationale.join("\n"))}`
}

function schemaFor(q: Question) {
  const wrong = wrongLetters(q)
  return {
    type: "object",
    properties: {
      rule: { type: "string" },
      why: { type: "string" },
      traps: {
        type: "object",
        properties: Object.fromEntries(wrong.map((L) => [L, { type: "string" }])),
        required: wrong,
        additionalProperties: false,
      },
      next: { type: "array", items: { type: "string" } },
    },
    required: ["rule", "why", "traps", "next"],
    additionalProperties: false,
  }
}

export class ExplainError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export async function writeExplanation(q: Question, qs: Map<string, Question>): Promise<Explanation> {
  const client = new Anthropic()
  let res
  try {
    res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: schemaFor(q) } },
      messages: [{ role: "user", content: buildPrompt(q, qs.get("9d6fd619")?.simple, qs.get("a4fa26dc")?.simple) }],
    })
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) throw new ExplainError(429, "busy, try again in a minute")
    throw e
  }
  if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") {
    throw new ExplainError(502, `no explanation (${res.stop_reason})`)
  }
  const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("")
  const x = JSON.parse(text) as Explanation
  x.next = (x.next || []).slice(0, 3).map(String)
  x.rule = String(x.rule || "")
  return x
}
