// Shared curated fallback data used by dashboard + API routes

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
    applicationUrl: "https://boards.greenhouse.io/anthropic#internships",
  },
  {
    id: "c-i-3", title: "Investment Banking Summer Analyst", company: "Goldman Sachs",
    location: "New York, NY", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Finance", "Investing"],
    applicationUrl: "https://www.goldmansachs.com/careers/students/programs/americas/summer-analyst-program.html",
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
    id: "c-i-6", title: "ML Research Intern", company: "Cohere",
    location: "Remote", isRemote: true, deadline: null, isPaid: true, salary: null,
    tags: ["Machine Learning / AI", "Software Engineering"],
    applicationUrl: "https://jobs.lever.co/cohere?commitment=Intern",
  },
  {
    id: "c-i-7", title: "Growth Marketing Intern", company: "Notion",
    location: "San Francisco, CA", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Marketing", "Entrepreneurship"],
    applicationUrl: "https://boards.greenhouse.io/notion#internships",
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
    applicationUrl: "https://vercel.com/careers#jobs",
  },
  {
    id: "c-i-10", title: "Finance & Strategy Intern", company: "Ramp",
    location: "New York, NY", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Finance", "Operations"],
    applicationUrl: "https://jobs.lever.co/ramp?commitment=Intern",
  },
  {
    id: "c-i-11", title: "Product Design Intern", company: "Figma",
    location: "San Francisco, CA", isRemote: false, deadline: null, isPaid: true, salary: null,
    tags: ["Design", "Product Management"],
    applicationUrl: "https://jobs.ashbyhq.com/figma?department=Internships",
  },
  {
    id: "c-i-12", title: "Software Engineering Intern", company: "Linear",
    location: "Remote", isRemote: true, deadline: null, isPaid: true, salary: null,
    tags: ["Software Engineering"],
    applicationUrl: "https://jobs.ashbyhq.com/linear",
  },
]

function nextWeekday(day: number, hour: number): string {
  const d = new Date()
  const diff = (day - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export function getCuratedEvents(): CuratedEvent[] {
  return [
    {
      id: "c-e-1", title: "Cerebral Valley AI Happy Hour",
      description: "Weekly gathering of AI founders, researchers, and enthusiasts in San Francisco. One of the most active AI communities in the Bay Area.",
      startDate: nextWeekday(5, 18), location: "San Francisco, CA", isVirtual: false,
      registrationUrl: "https://cerebralvalley.ai/events", imageUrl: null,
      tags: ["Machine Learning / AI", "Networking", "Entrepreneurship"], isFree: true, source: "Cerebral Valley",
    },
    {
      id: "c-e-2", title: "YC Startup School — Live Sessions",
      description: "Y Combinator's free online program for founders. Weekly talks from top founders and investors. Open to anyone building a startup.",
      startDate: nextWeekday(1, 10), location: null, isVirtual: true,
      registrationUrl: "https://www.startupschool.org", imageUrl: null,
      tags: ["Entrepreneurship", "Investing", "Networking"], isFree: true, source: "Y Combinator",
    },
    {
      id: "c-e-3", title: "SF Tech & Startup Events",
      description: "Curated tech events across San Francisco — founders, VCs, engineers, and operators all in one place.",
      startDate: nextWeekday(1, 9), location: "San Francisco, CA", isVirtual: false,
      registrationUrl: "https://lu.ma/sf", imageUrl: null,
      tags: ["Networking", "Entrepreneurship", "Software Engineering"], isFree: true, source: "Luma",
    },
    {
      id: "c-e-4", title: "NYC Tech Founders Mixer",
      description: "Monthly mixer for NYC's tech founders, PMs, and investors. Great for meeting people early in their startup journey.",
      startDate: nextWeekday(4, 18), location: "New York, NY", isVirtual: false,
      registrationUrl: "https://lu.ma/nyc", imageUrl: null,
      tags: ["Networking", "Entrepreneurship", "Investing"], isFree: true, source: "Luma",
    },
    {
      id: "c-e-5", title: "AI & ML Virtual Meetup",
      description: "Online gathering for ML practitioners and AI researchers. Talks on the latest models, research papers, and tooling.",
      startDate: nextWeekday(3, 17), location: null, isVirtual: true,
      registrationUrl: "https://lu.ma/discover", imageUrl: null,
      tags: ["Machine Learning / AI", "Data Science", "Networking"], isFree: true, source: "Luma",
    },
    {
      id: "c-e-6", title: "Finance & Investing Forum — Student Edition",
      description: "Monthly virtual forum connecting students interested in IB, VC, PE, and hedge funds with practitioners in the field.",
      startDate: nextWeekday(6, 10), location: null, isVirtual: true,
      registrationUrl: "https://lu.ma/discover", imageUrl: null,
      tags: ["Finance", "Investing", "Networking"], isFree: true, source: "Luma",
    },
    {
      id: "c-e-7", title: "Product & Design Critique Night",
      description: "Get live feedback on your product from senior PMs and designers. Workshop format with real actionable critique.",
      startDate: nextWeekday(3, 18), location: null, isVirtual: true,
      registrationUrl: "https://lu.ma/discover", imageUrl: null,
      tags: ["Product Management", "Design", "Networking"], isFree: true, source: "Luma",
    },
    {
      id: "c-e-8", title: "VC Office Hours — Pitch Practice",
      description: "Get feedback on your pitch from active investors. Open to pre-seed and seed stage founders across all industries.",
      startDate: nextWeekday(2, 14), location: null, isVirtual: true,
      registrationUrl: "https://lu.ma/discover", imageUrl: null,
      tags: ["Investing", "Entrepreneurship", "Finance"], isFree: true, source: "Luma",
    },
  ]
}

// Filter out bad URLs that are known to 408 (LinkedIn job search, expired postings)
export function hasGoodUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const { hostname } = new URL(url)
    const blocked = ["linkedin.com", "indeed.com"]
    return !blocked.some(d => hostname.endsWith(d))
  } catch { return false }
}
