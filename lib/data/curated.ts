// Shared curated fallback data used by dashboard + API routes.
// Keep outbound URLs specific or filtered; never use generic homepages for
// user-facing apply/RSVP actions.

export interface CuratedInternship {
  id: string
  title: string
  company: string
  location: string | null
  isRemote: boolean
  deadline: null
  isPaid: boolean
  salary: null
  tags: string[]
  applicationUrl: string
}

export interface CuratedEvent {
  id: string
  title: string
  description: string
  startDate: string
  location: string | null
  isVirtual: boolean
  registrationUrl: string
  imageUrl: null
  tags: string[]
  isFree: boolean
  source: string
}

export const CURATED_INTERNSHIPS: CuratedInternship[] = [
  {
    id: "c-i-1", title: "Software Engineering Intern", company: "Stripe",
    location: "San Francisco, CA", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Software Engineering"],
    applicationUrl: "https://stripe.com/jobs/search?teams[0]=university-recruiting",
  },
  {
    id: "c-i-2", title: "Software Engineering Intern", company: "Anthropic",
    location: "San Francisco, CA", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Machine Learning / AI", "Software Engineering"],
    applicationUrl: "https://jobs.ashbyhq.com/anthropic?department=Internship",
  },
  {
    id: "c-i-3", title: "Investment Banking Summer Analyst", company: "Goldman Sachs",
    location: "New York, NY", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Finance", "Investing"],
    applicationUrl: "https://www.goldmansachs.com/careers/students/programs-and-internships/americas/summer-analyst-program",
  },
  {
    id: "c-i-4", title: "Data Science Intern", company: "Databricks",
    location: "San Francisco, CA (Remote OK)", isRemote: true, deadline: null, isPaid: true, salary: null,
    tags: ["Data Science", "Machine Learning / AI"],
    applicationUrl: "https://www.databricks.com/company/careers/university-recruiting",
  },
  {
    id: "c-i-5", title: "Product Management Intern", company: "OpenAI",
    location: "San Francisco, CA", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Product Management", "Machine Learning / AI"],
    applicationUrl: "https://jobs.ashbyhq.com/openai?department=Internship",
  },
  {
    id: "c-i-6", title: "ML Research Intern", company: "Perplexity",
    location: "San Francisco, CA", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Machine Learning / AI", "Software Engineering"],
    applicationUrl: "https://jobs.ashbyhq.com/perplexity?department=University",
  },
  {
    id: "c-i-7", title: "Growth Marketing Intern", company: "Notion",
    location: "San Francisco, CA", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Marketing", "Entrepreneurship"],
    applicationUrl: "https://www.notion.com/careers?role=internship",
  },
  {
    id: "c-i-8", title: "Venture Capital Fellow", company: "a16z",
    location: "Menlo Park, CA", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Investing", "Finance", "Entrepreneurship"],
    applicationUrl: "https://jobs.a16z.com/jobs?categories=Internship",
  },
  {
    id: "c-i-9", title: "Software Engineering Intern", company: "Vercel",
    location: "Remote", isRemote: true, deadline: null, isPaid: true, salary: null,
    tags: ["Software Engineering"],
    applicationUrl: "https://vercel.com/careers?search=intern",
  },
  {
    id: "c-i-10", title: "Product Design Intern", company: "Figma",
    location: "San Francisco, CA", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Design", "Product Management"],
    applicationUrl: "https://jobs.ashbyhq.com/figma?department=Internships",
  },
]

export function getCuratedEvents(): CuratedEvent[] {
  // The live Luma/Cerebral Valley scrapers return direct event pages. Generic
  // fallback city/discovery pages caused bad RSVP experiences, so no static
  // event fallback is exposed unless direct RSVP URLs are added here later.
  return []
}

// Filter out bad URLs that are known to 408 (LinkedIn job search, expired postings)
export function hasGoodUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const { hostname } = new URL(url)
    const blocked = ["linkedin.com", "indeed.com"]
    return !blocked.some((d) => hostname.endsWith(d))
  } catch {
    return false
  }
}
