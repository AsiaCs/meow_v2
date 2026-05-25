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

const SOURCE = "Curated"

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
      title: "Product Design Intern",
      company: "Figma",
      location: "San Francisco, CA",
      isRemote: false,
      description:
        "Help define the future of design tooling at Figma. Own design end-to-end from research to final polish on features used by millions of creators worldwide.",
      applicationUrl: "https://jobs.ashbyhq.com/figma?department=Internships",
      isPaid: true,
      tags: ["Design", "Product Management"],
      source: SOURCE,
      sourceUrl: "https://jobs.ashbyhq.com/figma?department=Internships",
    },
    {
      title: "Data Science Intern",
      company: "Databricks",
      location: "San Francisco, CA (Remote OK)",
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
      title: "Summer Analyst Programs",
      company: "Goldman Sachs",
      location: "New York, NY",
      isRemote: false,
      description:
        "Goldman Sachs' student programs hub — apply to summer analyst roles across Investment Banking, Engineering, Markets, and Asset Management.",
      applicationUrl: "https://www.goldmansachs.com/careers/students",
      isPaid: true,
      tags: ["Finance", "Investing"],
      source: SOURCE,
      sourceUrl: "https://www.goldmansachs.com/careers/students",
    },
    {
      title: "Machine Learning Intern",
      company: "Anthropic",
      location: "San Francisco, CA (Remote OK)",
      isRemote: true,
      description:
        "Research and engineer AI systems at Anthropic. Contribute to safety-focused model work and production AI infrastructure.",
      applicationUrl: "https://jobs.ashbyhq.com/anthropic?department=Internship",
      isPaid: true,
      tags: ["Machine Learning / AI", "Software Engineering"],
      source: SOURCE,
      sourceUrl: "https://jobs.ashbyhq.com/anthropic?department=Internship",
    },
    {
      title: "Software Engineering Intern",
      company: "Perplexity",
      location: "Remote",
      isRemote: true,
      description:
        "Build product and infrastructure for AI-powered answer and research workflows with a fast-moving engineering team.",
      applicationUrl: "https://jobs.ashbyhq.com/perplexity?department=University",
      isPaid: true,
      tags: ["Software Engineering", "Design"],
      source: SOURCE,
      sourceUrl: "https://jobs.ashbyhq.com/perplexity?department=University",
    },
    {
      title: "Growth Marketing Intern",
      company: "Notion",
      location: "San Francisco, CA",
      isRemote: false,
      description:
        "Drive user acquisition and activation for Notion's expanding product suite. Run experiments, analyze funnels, and collaborate with the brand team.",
      applicationUrl: "https://www.notion.com/careers?role=internship",
      isPaid: true,
      tags: ["Marketing", "Entrepreneurship"],
      source: SOURCE,
      sourceUrl: "https://www.notion.com/careers?role=internship",
    },
    {
      title: "Software Engineering Intern",
      company: "Vercel",
      location: "Remote",
      isRemote: true,
      description:
        "Build the infrastructure that powers the modern web. Work on the deployment platform used by millions of developers worldwide.",
      applicationUrl: "https://vercel.com/careers?search=intern",
      isPaid: true,
      tags: ["Software Engineering"],
      source: SOURCE,
      sourceUrl: "https://vercel.com/careers?search=intern",
    },
    {
      title: "Finance & Strategy Intern",
      company: "a16z",
      location: "Menlo Park, CA",
      isRemote: false,
      description:
        "Explore venture capital and startup investing through a filtered a16z internship and early-career opportunities board.",
      applicationUrl: "https://jobs.a16z.com/jobs?categories=Internship",
      isPaid: true,
      tags: ["Finance", "Operations"],
      source: SOURCE,
      sourceUrl: "https://jobs.a16z.com/jobs?categories=Internship",
    },
    {
      title: "Software Engineering Intern",
      company: "Anthropic",
      location: "San Francisco, CA (Remote OK)",
      isRemote: true,
      description:
        "Work on safety research and AI systems at Anthropic. Contribute to building reliable, interpretable AI that benefits humanity.",
      applicationUrl: "https://jobs.ashbyhq.com/anthropic?department=Internship",
      isPaid: true,
      tags: ["Machine Learning / AI", "Software Engineering"],
      source: SOURCE,
      sourceUrl: "https://jobs.ashbyhq.com/anthropic?department=Internship",
    },
    {
      title: "Product Management Intern",
      company: "OpenAI",
      location: "San Francisco, CA",
      isRemote: false,
      description:
        "Define roadmap and product experiences for AI tools. Work cross-functionally with engineering and design on internship-relevant openings.",
      applicationUrl: "https://jobs.ashbyhq.com/openai?department=Internship",
      isPaid: true,
      tags: ["Product Management"],
      source: SOURCE,
      sourceUrl: "https://jobs.ashbyhq.com/openai?department=Internship",
    },
  ]

  if (interests.length === 0) return base

  // Rank by overlap with user interests
  const interestLower = interests.map((i) => i.toLowerCase())
  return base.sort((a, b) => {
    const aScore = a.tags.filter((t) => interestLower.some((i) => t.toLowerCase().includes(i))).length
    const bScore = b.tags.filter((t) => interestLower.some((i) => t.toLowerCase().includes(i))).length
    return bScore - aScore
  })
}

export async function scrapeInternships(interests: string[] = []): Promise<ScrapedInternship[]> {
  // LinkedIn scraping is blocked server-side and produces unreliable URLs.
  // We rely on the curated list of company career pages, each verified by
  // filterReachable in the API route before being returned to the client.
  return getFallbackInternships(interests)
}
