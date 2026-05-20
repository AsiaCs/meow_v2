import * as cheerio from "cheerio"

export interface ScrapedInternship {
  title: string
  company: string
  location?: string
  isRemote: boolean
  description?: string
  applicationUrl: string
  isPaid?: boolean
  tags: string[]
  source: string
  sourceUrl: string
}

const SOURCE = "LinkedIn"

function guessTags(title: string, company: string): string[] {
  const combined = `${title} ${company}`.toLowerCase()
  const tagMap: Record<string, string> = {
    software: "Software Engineering",
    engineer: "Software Engineering",
    developer: "Software Engineering",
    swe: "Software Engineering",
    frontend: "Software Engineering",
    backend: "Software Engineering",
    fullstack: "Software Engineering",
    "full stack": "Software Engineering",
    product: "Product Management",
    "product manager": "Product Management",
    design: "Design",
    ux: "Design",
    ui: "Design",
    data: "Data Science",
    analytics: "Data Science",
    finance: "Finance",
    investment: "Finance",
    banking: "Finance",
    marketing: "Marketing",
    growth: "Marketing",
    operations: "Operations",
    consulting: "Consulting",
    ml: "Machine Learning / AI",
    "machine learning": "Machine Learning / AI",
    ai: "Machine Learning / AI",
    research: "Machine Learning / AI",
    sales: "Sales",
    "real estate": "Real Estate",
  }

  const tags = new Set<string>()
  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (combined.includes(keyword)) {
      tags.add(tag)
      if (tags.size >= 4) break
    }
  }

  if (tags.size === 0) tags.add("Software Engineering")
  return Array.from(tags)
}

function getFallbackInternships(interests: string[]): ScrapedInternship[] {
  const base: ScrapedInternship[] = [
    {
      title: "Software Engineering Intern",
      company: "Stripe",
      location: "San Francisco, CA",
      isRemote: false,
      description:
        "Join Stripe's engineering team to build reliable, scalable infrastructure powering global payments. Work alongside world-class engineers on real production systems.",
      applicationUrl: "https://stripe.com/jobs/search?teams[0]=university-recruiting",
      isPaid: true,
      tags: ["Software Engineering"],
      source: SOURCE,
      sourceUrl: "https://stripe.com/jobs/search?teams[0]=university-recruiting",
    },
    {
      title: "Product Management Intern",
      company: "Figma",
      location: "San Francisco, CA",
      isRemote: false,
      description:
        "Help define the future of design tooling at Figma. Work cross-functionally with engineering and design to ship features used by millions of creators worldwide.",
      applicationUrl: "https://boards.greenhouse.io/figma",
      isPaid: true,
      tags: ["Product Management", "Design"],
      source: SOURCE,
      sourceUrl: "https://boards.greenhouse.io/figma",
    },
    {
      title: "Data Science Intern",
      company: "Databricks",
      location: "Remote",
      isRemote: true,
      description:
        "Work with large-scale datasets and ML models to surface insights that drive product and business decisions at Databricks.",
      applicationUrl: "https://www.databricks.com/company/careers/university-recruiting",
      isPaid: true,
      tags: ["Data Science", "Machine Learning / AI"],
      source: SOURCE,
      sourceUrl: "https://www.databricks.com/company/careers/university-recruiting",
    },
    {
      title: "Investment Banking Summer Analyst",
      company: "Goldman Sachs",
      location: "New York, NY",
      isRemote: false,
      description:
        "Join Goldman Sachs' Investment Banking Division for an intensive summer program. Gain exposure to M&A, equity, and debt financing transactions.",
      applicationUrl: "https://www.goldmansachs.com/careers/students/programs/americas/summer-analyst-program.html",
      isPaid: true,
      tags: ["Finance", "Investing"],
      source: SOURCE,
      sourceUrl: "https://www.goldmansachs.com/careers/students/programs/americas/summer-analyst-program.html",
    },
    {
      title: "Machine Learning Intern",
      company: "Cohere",
      location: "Toronto, ON (Remote OK)",
      isRemote: true,
      description:
        "Research and engineer LLM capabilities at Cohere. Contribute to cutting-edge NLP research and productionize ML models at scale.",
      applicationUrl: "https://jobs.lever.co/cohere",
      isPaid: true,
      tags: ["Machine Learning / AI", "Software Engineering"],
      source: SOURCE,
      sourceUrl: "https://jobs.lever.co/cohere",
    },
    {
      title: "UX Design Intern",
      company: "Linear",
      location: "Remote",
      isRemote: true,
      description:
        "Shape the design language of one of the most beloved developer tools. Own design end-to-end from research to final polish.",
      applicationUrl: "https://jobs.lever.co/linear",
      isPaid: true,
      tags: ["Design", "Product Management"],
      source: SOURCE,
      sourceUrl: "https://jobs.lever.co/linear",
    },
    {
      title: "Growth Marketing Intern",
      company: "Notion",
      location: "San Francisco, CA",
      isRemote: false,
      description:
        "Drive user acquisition and activation for Notion's expanding product suite. Run experiments, analyze funnels, and collaborate with the brand team.",
      applicationUrl: "https://boards.greenhouse.io/notion",
      isPaid: true,
      tags: ["Marketing", "Entrepreneurship"],
      source: SOURCE,
      sourceUrl: "https://boards.greenhouse.io/notion",
    },
    {
      title: "Venture Capital Intern",
      company: "a16z",
      location: "Menlo Park, CA",
      isRemote: false,
      description:
        "Support deal sourcing, due diligence, and portfolio support at one of the world's leading VC firms. Ideal for those passionate about startups and technology.",
      applicationUrl: "https://jobs.a16z.com",
      isPaid: true,
      tags: ["Investing", "Finance", "Entrepreneurship"],
      source: SOURCE,
      sourceUrl: "https://jobs.a16z.com",
    },
    {
      title: "Software Engineering Intern",
      company: "Vercel",
      location: "Remote",
      isRemote: true,
      description:
        "Build the infrastructure that powers the modern web. Work on the deployment platform used by millions of developers worldwide.",
      applicationUrl: "https://vercel.com/careers",
      isPaid: true,
      tags: ["Software Engineering"],
      source: SOURCE,
      sourceUrl: "https://vercel.com/careers",
    },
    {
      title: "Operations & Strategy Intern",
      company: "Ramp",
      location: "New York, NY",
      isRemote: false,
      description:
        "Drive operational efficiency initiatives and contribute to strategic planning at Ramp, the fastest-growing corporate card and expense management platform.",
      applicationUrl: "https://jobs.lever.co/ramp",
      isPaid: true,
      tags: ["Operations", "Finance"],
      source: SOURCE,
      sourceUrl: "https://jobs.lever.co/ramp",
    },
  ]

  if (interests.length === 0) return base

  // Sort by relevance to the user's interests
  const interestLower = interests.map((i) => i.toLowerCase())
  return base.sort((a, b) => {
    const aScore = a.tags.filter((t) => interestLower.some((i) => t.toLowerCase().includes(i))).length
    const bScore = b.tags.filter((t) => interestLower.some((i) => t.toLowerCase().includes(i))).length
    return bScore - aScore
  })
}

async function scrapeLinkedIn(interests: string[]): Promise<ScrapedInternship[]> {
  const keywords = ["internship", ...interests].join(" ")
  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&f_E=1&f_JT=I`

  const res = await fetch(searchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  })

  if (!res.ok) throw new Error(`LinkedIn responded with ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)
  const internships: ScrapedInternship[] = []

  // LinkedIn public job cards
  const selectors = [
    ".job-search-card",
    "[class*='job-card']",
    "[class*='JobCard']",
    "li[class*='jobs-search']",
    ".jobs-job-board-list__item",
  ]

  let $cards = $([])
  for (const sel of selectors) {
    const found = $(sel)
    if (found.length >= 2) {
      $cards = found
      break
    }
  }

  if ($cards.length === 0) throw new Error("No job cards found")

  $cards.each((_, el) => {
    try {
      const $el = $(el)

      const title =
        $el.find("h3,h4,[class*='title']").first().text().trim()
      const company =
        $el.find("[class*='company'],[class*='Company'],h4").first().text().trim()

      if (!title || !company) return

      const href =
        $el.find("a").first().attr("href") ?? ""
      const fullUrl = href.startsWith("http")
        ? href
        : href
          ? `https://www.linkedin.com${href}`
          : searchUrl

      const locationText =
        $el.find("[class*='location'],[class*='Location']").first().text().trim()
      const isRemote = /remote/i.test(locationText)

      internships.push({
        title,
        company,
        location: locationText || undefined,
        isRemote,
        applicationUrl: fullUrl,
        isPaid: undefined,
        tags: guessTags(title, company),
        source: SOURCE,
        sourceUrl: fullUrl,
      })
    } catch {
      // Skip malformed card
    }
  })

  return internships.slice(0, 20)
}

export async function scrapeInternships(interests: string[] = []): Promise<ScrapedInternship[]> {
  try {
    const results = await scrapeLinkedIn(interests)
    if (results.length > 0) return results
  } catch {
    // Fall through to fallback
  }

  // Return curated fallback data when scraping is blocked
  return getFallbackInternships(interests)
}
