import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Curated fallback internships with verified apply URLs
const FALLBACK: Array<{
  id: string
  title: string
  company: string
  location: string | null
  isRemote: boolean
  description: string
  applicationUrl: string
  deadline: null
  isPaid: boolean
  salary: null
  tags: string[]
  source: string
  sourceUrl: string
  createdAt: string
}> = [
  {
    id: "fallback-1",
    title: "Software Engineering Intern",
    company: "Stripe",
    location: "San Francisco, CA",
    isRemote: false,
    description: "Join Stripe's engineering team to build reliable, scalable infrastructure powering global payments.",
    applicationUrl: "https://stripe.com/jobs/search?teams[0]=university-recruiting",
    deadline: null, isPaid: true, salary: null,
    tags: ["Software Engineering"],
    source: "Curated", sourceUrl: "https://stripe.com/jobs/search?teams[0]=university-recruiting",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    title: "Product Design Intern",
    company: "Figma",
    location: "San Francisco, CA",
    isRemote: false,
    description: "Own design end-to-end from research to final polish on features used by millions of creators worldwide.",
    applicationUrl: "https://www.figma.com/careers/jobs/",
    deadline: null, isPaid: true, salary: null,
    tags: ["Design", "Product Management"],
    source: "Curated", sourceUrl: "https://www.figma.com/careers/jobs/",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    title: "Data Science Intern",
    company: "Databricks",
    location: "San Francisco, CA (Remote OK)",
    isRemote: true,
    description: "Work with large-scale datasets and ML models to surface insights that drive product and business decisions.",
    applicationUrl: "https://www.databricks.com/company/careers/university-recruiting",
    deadline: null, isPaid: true, salary: null,
    tags: ["Data Science", "Machine Learning / AI"],
    source: "Curated", sourceUrl: "https://www.databricks.com/company/careers/university-recruiting",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-4",
    title: "Investment Banking Summer Analyst",
    company: "Goldman Sachs",
    location: "New York, NY",
    isRemote: false,
    description: "Gain exposure to M&A, equity, and debt financing transactions in Goldman's Investment Banking Division.",
    applicationUrl: "https://www.goldmansachs.com/careers/students/programs/americas/summer-analyst-program.html",
    deadline: null, isPaid: true, salary: null,
    tags: ["Finance", "Investing"],
    source: "Curated", sourceUrl: "https://www.goldmansachs.com/careers/students/programs/americas/summer-analyst-program.html",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-5",
    title: "Software Engineering Intern",
    company: "Anthropic",
    location: "San Francisco, CA",
    isRemote: false,
    description: "Work on safety research and AI systems. Contribute to building reliable, interpretable AI.",
    applicationUrl: "https://boards.greenhouse.io/anthropic",
    deadline: null, isPaid: true, salary: null,
    tags: ["Machine Learning / AI", "Software Engineering"],
    source: "Curated", sourceUrl: "https://boards.greenhouse.io/anthropic",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-6",
    title: "ML Research Intern",
    company: "Cohere",
    location: "Remote",
    isRemote: true,
    description: "Contribute to cutting-edge NLP research and productionize ML models at scale.",
    applicationUrl: "https://jobs.lever.co/cohere?commitment=Intern",
    deadline: null, isPaid: true, salary: null,
    tags: ["Machine Learning / AI", "Software Engineering"],
    source: "Curated", sourceUrl: "https://jobs.lever.co/cohere?commitment=Intern",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-7",
    title: "Growth Marketing Intern",
    company: "Notion",
    location: "San Francisco, CA",
    isRemote: false,
    description: "Drive user acquisition and activation for Notion's expanding product suite. Run experiments and analyze funnels.",
    applicationUrl: "https://boards.greenhouse.io/notion",
    deadline: null, isPaid: true, salary: null,
    tags: ["Marketing", "Entrepreneurship"],
    source: "Curated", sourceUrl: "https://boards.greenhouse.io/notion",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-8",
    title: "Software Engineering Intern",
    company: "Vercel",
    location: "Remote",
    isRemote: true,
    description: "Build the infrastructure that powers the modern web. Work on the platform used by millions of developers.",
    applicationUrl: "https://vercel.com/careers",
    deadline: null, isPaid: true, salary: null,
    tags: ["Software Engineering"],
    source: "Curated", sourceUrl: "https://vercel.com/careers",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-9",
    title: "Venture Capital Fellow",
    company: "a16z",
    location: "Menlo Park, CA",
    isRemote: false,
    description: "Support deal sourcing, due diligence, and portfolio support at one of the world's leading VC firms.",
    applicationUrl: "https://a16z.com/jobs/",
    deadline: null, isPaid: true, salary: null,
    tags: ["Investing", "Finance", "Entrepreneurship"],
    source: "Curated", sourceUrl: "https://a16z.com/jobs/",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-10",
    title: "Finance & Strategy Intern",
    company: "Ramp",
    location: "New York, NY",
    isRemote: false,
    description: "Drive financial modeling and strategic initiatives at the fastest-growing corporate card platform.",
    applicationUrl: "https://jobs.lever.co/ramp?commitment=Intern",
    deadline: null, isPaid: true, salary: null,
    tags: ["Finance", "Operations"],
    source: "Curated", sourceUrl: "https://jobs.lever.co/ramp?commitment=Intern",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-11",
    title: "Software Engineering Intern",
    company: "Linear",
    location: "Remote",
    isRemote: true,
    description: "Build the infrastructure behind one of the most beloved developer tools with a small, high-craft team.",
    applicationUrl: "https://jobs.ashbyhq.com/linear",
    deadline: null, isPaid: true, salary: null,
    tags: ["Software Engineering"],
    source: "Curated", sourceUrl: "https://jobs.ashbyhq.com/linear",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-12",
    title: "Product Management Intern",
    company: "OpenAI",
    location: "San Francisco, CA",
    isRemote: false,
    description: "Define the roadmap for AI products used by millions. Work cross-functionally to ship AI-powered features.",
    applicationUrl: "https://openai.com/careers",
    deadline: null, isPaid: true, salary: null,
    tags: ["Product Management", "Machine Learning / AI"],
    source: "Curated", sourceUrl: "https://openai.com/careers",
    createdAt: new Date().toISOString(),
  },
]

function matchesTags(itemTags: string[], filterTags: string[]): boolean {
  return filterTags.some((ft) =>
    itemTags.some((it) => it.toLowerCase().includes(ft.toLowerCase()))
  )
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get("tags")
    const remoteParam = searchParams.get("remote")
    const paidParam = searchParams.get("paid")
    const filterTags = tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : []

    const supabase = await createClient()
    let query = supabase
      .from("internships")
      .select("id, title, company, location, isRemote, description, applicationUrl, deadline, isPaid, salary, tags, source, sourceUrl, createdAt")
      .order("createdAt", { ascending: false })

    if (filterTags.length > 0) query = query.overlaps("tags", filterTags)
    if (remoteParam === "true") query = query.eq("isRemote", true)
    if (paidParam === "true") query = query.eq("isPaid", true)

    const { data } = await query
    const dbResults = data ?? []

    // Merge DB results with fallback, deduplicated by company+title
    const seen = new Set(dbResults.map((i: any) => `${i.company}|${i.title}`))
    let fallback = FALLBACK.filter((f) => !seen.has(`${f.company}|${f.title}`))

    // Apply same filters to fallback
    if (filterTags.length > 0) fallback = fallback.filter((f) => matchesTags(f.tags, filterTags))
    if (remoteParam === "true") fallback = fallback.filter((f) => f.isRemote)
    if (paidParam === "true") fallback = fallback.filter((f) => f.isPaid)

    const combined = [...dbResults, ...fallback]
    return NextResponse.json(combined)
  } catch (error) {
    console.error("[internships/GET]", error)
    // Even on DB failure, return curated fallback
    return NextResponse.json(FALLBACK)
  }
}
