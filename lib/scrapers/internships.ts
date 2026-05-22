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
      applicationUrl: "https://www.figma.com/careers/jobs/?team=design",
      isPaid: true,
      tags: ["Design", "Product Management"],
      source: SOURCE,
      sourceUrl: "https://www.figma.com/careers/jobs/?team=design",
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
      title: "Investment Banking Summer Analyst",
      company: "Goldman Sachs",
      location: "New York, NY",
      isRemote: false,
      description:
        "Join Goldman Sachs' Investment Banking Division for an intensive summer program. Gain exposure to M&A, equity, and debt financing transactions.",
      applicationUrl:
        "https://www.goldmansachs.com/careers/students/programs/americas/summer-analyst-program.html",
      isPaid: true,
      tags: ["Finance", "Investing"],
      source: SOURCE,
      sourceUrl:
        "https://www.goldmansachs.com/careers/students/programs/americas/summer-analyst-program.html",
    },
    {
      title: "Machine Learning Intern",
      company: "Cohere",
      location: "Toronto, ON (Remote OK)",
      isRemote: true,
      description:
        "Research and engineer LLM capabilities at Cohere. Contribute to cutting-edge NLP research and productionize ML models at scale.",
      applicationUrl: "https://jobs.lever.co/cohere?commitment=Intern",
      isPaid: true,
      tags: ["Machine Learning / AI", "Software Engineering"],
      source: SOURCE,
      sourceUrl: "https://jobs.lever.co/cohere?commitment=Intern",
    },
    {
      title: "Software Engineering Intern",
      company: "Linear",
      location: "Remote",
      isRemote: true,
      description:
        "Build the infrastructure behind one of the most beloved developer tools. Work on core product with a small, high-craft engineering team.",
      applicationUrl: "https://jobs.ashbyhq.com/linear",
      isPaid: true,
      tags: ["Software Engineering", "Design"],
      source: SOURCE,
      sourceUrl: "https://jobs.ashbyhq.com/linear",
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
      title: "Software Engineering Intern",
      company: "Vercel",
      location: "Remote",
      isRemote: true,
      description:
        "Build the infrastructure that powers the modern web. Work on the deployment platform used by millions of developers worldwide.",
      applicationUrl: "https://vercel.com/careers#open-positions",
      isPaid: true,
      tags: ["Software Engineering"],
      source: SOURCE,
      sourceUrl: "https://vercel.com/careers#open-positions",
    },
    {
      title: "Finance & Strategy Intern",
      company: "Ramp",
      location: "New York, NY",
      isRemote: false,
      description:
        "Drive financial modeling and strategic initiatives at Ramp, the fastest-growing corporate card and expense management platform.",
      applicationUrl: "https://jobs.lever.co/ramp?commitment=Intern",
      isPaid: true,
      tags: ["Finance", "Operations"],
      source: SOURCE,
      sourceUrl: "https://jobs.lever.co/ramp?commitment=Intern",
    },
    {
      title: "Software Engineering Intern",
      company: "Anthropic",
      location: "San Francisco, CA (Remote OK)",
      isRemote: true,
      description:
        "Work on safety research and AI systems at Anthropic. Contribute to building reliable, interpretable AI that benefits humanity.",
      applicationUrl: "https://boards.greenhouse.io/anthropic",
      isPaid: true,
      tags: ["Machine Learning / AI", "Software Engineering"],
      source: SOURCE,
      sourceUrl: "https://boards.greenhouse.io/anthropic",
    },
    {
      title: "Product Management Intern",
      company: "Notion",
      location: "San Francisco, CA",
      isRemote: false,
      description:
        "Define the roadmap for Notion's next wave of features. Work cross-functionally with engineering and design to ship products used by millions.",
      applicationUrl: "https://boards.greenhouse.io/notion",
      isPaid: true,
      tags: ["Product Management"],
      source: SOURCE,
      sourceUrl: "https://boards.greenhouse.io/notion",
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
