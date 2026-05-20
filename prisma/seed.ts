import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database…")

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
  const events = [
    {
      title: "AI Founders Summit 2026",
      description:
        "The premier gathering for founders building with AI. Join 500+ founders, investors, and researchers for a day of keynotes, fireside chats, and curated networking. Speakers include leaders from OpenAI, Anthropic, and top AI labs.",
      startDate: new Date("2026-06-10T09:00:00Z"),
      endDate: new Date("2026-06-10T18:00:00Z"),
      location: "San Francisco, CA",
      isVirtual: false,
      registrationUrl: "https://aifounders.summit/register",
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
      tags: ["Machine Learning / AI", "Entrepreneurship", "Investing"],
      source: "Cerebral Valley",
      sourceUrl: "https://cerebralvalley.ai/events/ai-founders-summit-2026",
      isFree: false,
      status: "APPROVED" as const,
    },
    {
      title: "NYC Finance & Tech Networking Mixer",
      description:
        "Connect with professionals at the intersection of finance and technology. This intimate mixer brings together analysts, product managers, and engineers from leading banks and fintech startups.",
      startDate: new Date("2026-05-28T18:30:00Z"),
      endDate: new Date("2026-05-28T21:00:00Z"),
      location: "New York, NY",
      isVirtual: false,
      registrationUrl: "https://lu.ma/nyc-finance-tech-mixer",
      imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800",
      tags: ["Finance", "Networking", "Software Engineering"],
      source: "Luma",
      sourceUrl: "https://lu.ma/nyc-finance-tech-mixer",
      isFree: true,
      status: "APPROVED" as const,
    },
    {
      title: "Design Systems Virtual Conference",
      description:
        "A day-long virtual deep-dive into design systems at scale. Hear from design leads at Vercel, Shopify, and Airbnb about how they build, maintain, and evolve their component libraries.",
      startDate: new Date("2026-06-03T10:00:00Z"),
      endDate: new Date("2026-06-03T17:00:00Z"),
      isVirtual: true,
      virtualLink: "https://designsystems.conf/stream",
      registrationUrl: "https://designsystems.conf/register",
      tags: ["Design", "Software Engineering"],
      source: "user",
      isFree: true,
      status: "APPROVED" as const,
    },
    {
      title: "Chicago Consulting Career Fair",
      description:
        "Meet recruiters from McKinsey, BCG, Bain, Deloitte, and 20+ other top consulting firms. Bring your resume and case prep materials. Business casual attire required.",
      startDate: new Date("2026-06-15T12:00:00Z"),
      endDate: new Date("2026-06-15T17:00:00Z"),
      location: "Chicago, IL",
      isVirtual: false,
      registrationUrl: "https://chicagoconsulting.events/career-fair",
      tags: ["Consulting", "Finance"],
      source: "user",
      isFree: false,
      status: "APPROVED" as const,
    },
    {
      title: "Startup Demo Day — Spring 2026",
      description:
        "Watch 20 early-stage startups pitch live to a room of 300+ investors and industry veterans. Startups span SaaS, consumer apps, climate tech, and biotech.",
      startDate: new Date("2026-06-20T14:00:00Z"),
      endDate: new Date("2026-06-20T19:00:00Z"),
      location: "Los Angeles, CA",
      isVirtual: false,
      registrationUrl: "https://startupla.com/demo-day-spring-2026",
      imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
      tags: ["Entrepreneurship", "Investing"],
      source: "Luma",
      sourceUrl: "https://lu.ma/startup-demo-day-la",
      isFree: true,
      status: "APPROVED" as const,
    },
    {
      title: "Data Science & ML Workshop: RAG Systems",
      description:
        "Hands-on workshop covering Retrieval-Augmented Generation (RAG) architectures. Build a production-ready RAG pipeline from scratch using LangChain, Pinecone, and GPT-4o.",
      startDate: new Date("2026-06-07T10:00:00Z"),
      endDate: new Date("2026-06-07T14:00:00Z"),
      isVirtual: true,
      virtualLink: "https://mlworkshop.io/rag-systems",
      registrationUrl: "https://mlworkshop.io/rag-systems/register",
      tags: ["Machine Learning / AI", "Data Science", "Software Engineering"],
      source: "Cerebral Valley",
      sourceUrl: "https://cerebralvalley.ai/events/rag-workshop-2026",
      isFree: false,
      status: "APPROVED" as const,
    },
    {
      title: "Real Estate Tech Networking Breakfast",
      description:
        "An early-morning networking event for professionals at the intersection of real estate and technology. Join PropTech founders, brokers, and investors over breakfast.",
      startDate: new Date("2026-06-25T08:00:00Z"),
      endDate: new Date("2026-06-25T10:30:00Z"),
      location: "New York, NY",
      isVirtual: false,
      registrationUrl: "https://lu.ma/retech-nyc-breakfast",
      tags: ["Real Estate", "Entrepreneurship"],
      source: "Luma",
      sourceUrl: "https://lu.ma/retech-nyc-breakfast",
      isFree: true,
      status: "APPROVED" as const,
    },
    {
      title: "Product Management Summit: AI-First Products",
      description:
        "Two days of talks, workshops, and networking for PMs building AI-native products. Topics include LLM evaluation, AI UX patterns, and managing AI feature roadmaps.",
      startDate: new Date("2026-07-08T09:00:00Z"),
      endDate: new Date("2026-07-09T17:00:00Z"),
      location: "Seattle, WA",
      isVirtual: false,
      registrationUrl: "https://pmsummit.io/ai-products-2026",
      imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800",
      tags: ["Product Management", "Machine Learning / AI"],
      source: "user",
      isFree: false,
      status: "APPROVED" as const,
    },
  ]

  for (const event of events) {
    await prisma.event.upsert({
      where: { id: `seed-event-${event.title.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}` },
      update: {},
      create: {
        id: `seed-event-${event.title.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}`,
        ...event,
      },
    })
  }

  console.log(`Seeded ${events.length} events.`)

  // ---------------------------------------------------------------------------
  // Internships
  // ---------------------------------------------------------------------------
  const internships = [
    {
      title: "Software Engineering Intern",
      company: "Stripe",
      location: "San Francisco, CA",
      isRemote: false,
      description:
        "Join Stripe's engineering team to build reliable, scalable infrastructure powering global payments. Work on real production systems alongside world-class engineers. Projects span payments, fraud detection, developer tools, and more.",
      applicationUrl: "https://stripe.com/jobs/search?q=intern",
      deadline: new Date("2026-09-01T00:00:00Z"),
      isPaid: true,
      salary: "$8,500/month",
      tags: ["Software Engineering"],
      source: "LinkedIn",
      sourceUrl: "https://stripe.com/jobs",
    },
    {
      title: "Product Management Intern",
      company: "Figma",
      location: "San Francisco, CA",
      isRemote: false,
      description:
        "Help define the future of design tooling at Figma. Own a product area end-to-end: conduct user research, write specs, and collaborate with engineering and design to ship features used by millions of creators worldwide.",
      applicationUrl: "https://www.figma.com/careers",
      deadline: new Date("2026-08-15T00:00:00Z"),
      isPaid: true,
      salary: "$7,500/month",
      tags: ["Product Management", "Design"],
      source: "LinkedIn",
      sourceUrl: "https://www.figma.com/careers",
    },
    {
      title: "Data Science Intern",
      company: "Databricks",
      location: "Remote",
      isRemote: true,
      description:
        "Work with petabyte-scale datasets and state-of-the-art ML models to surface insights that drive product and business decisions. You'll build data pipelines, run experiments, and present findings to senior leadership.",
      applicationUrl: "https://www.databricks.com/company/careers",
      deadline: new Date("2026-09-15T00:00:00Z"),
      isPaid: true,
      salary: "$9,000/month",
      tags: ["Data Science", "Machine Learning / AI"],
      source: "LinkedIn",
      sourceUrl: "https://www.databricks.com/company/careers",
    },
    {
      title: "Investment Banking Summer Analyst",
      company: "Goldman Sachs",
      location: "New York, NY",
      isRemote: false,
      description:
        "Join Goldman Sachs' Investment Banking Division for an intensive 10-week summer program. Gain hands-on exposure to M&A advisory, equity offerings, and leveraged finance transactions across a range of industries.",
      applicationUrl: "https://www.goldmansachs.com/careers/students",
      deadline: new Date("2026-10-01T00:00:00Z"),
      isPaid: true,
      salary: "$110,000/year equivalent",
      tags: ["Finance", "Investing"],
      source: "LinkedIn",
      sourceUrl: "https://www.goldmansachs.com/careers",
    },
    {
      title: "Machine Learning Intern",
      company: "Cohere",
      location: "Toronto, ON (Remote OK)",
      isRemote: true,
      description:
        "Research and engineer LLM capabilities at Cohere. Work on fine-tuning, RLHF, retrieval, and evaluation pipelines. Contribute to cutting-edge NLP research and productionize ML models at enterprise scale.",
      applicationUrl: "https://cohere.com/careers",
      deadline: new Date("2026-08-30T00:00:00Z"),
      isPaid: true,
      salary: "$8,000/month",
      tags: ["Machine Learning / AI", "Software Engineering", "Data Science"],
      source: "LinkedIn",
      sourceUrl: "https://cohere.com/careers",
    },
    {
      title: "UX Design Intern",
      company: "Linear",
      location: "Remote",
      isRemote: true,
      description:
        "Shape the design language of one of the most beloved developer tools. Own design end-to-end: user interviews, wireframes, prototypes, and final high-fidelity screens. Exceptional attention to craft is required.",
      applicationUrl: "https://linear.app/careers",
      deadline: new Date("2026-09-01T00:00:00Z"),
      isPaid: true,
      salary: "$6,500/month",
      tags: ["Design"],
      source: "LinkedIn",
      sourceUrl: "https://linear.app/careers",
    },
    {
      title: "Growth Marketing Intern",
      company: "Notion",
      location: "San Francisco, CA",
      isRemote: false,
      description:
        "Drive user acquisition and activation for Notion's expanding product suite. Run A/B experiments, analyze conversion funnels, and collaborate with the brand team on campaigns reaching millions of users.",
      applicationUrl: "https://www.notion.so/careers",
      deadline: new Date("2026-08-01T00:00:00Z"),
      isPaid: true,
      salary: "$5,500/month",
      tags: ["Marketing"],
      source: "LinkedIn",
      sourceUrl: "https://www.notion.so/careers",
    },
    {
      title: "Venture Capital Intern",
      company: "Andreessen Horowitz (a16z)",
      location: "Menlo Park, CA",
      isRemote: false,
      description:
        "Support deal sourcing, technical due diligence, and portfolio company support at one of the world's leading venture capital firms. Ideal for those deeply passionate about startups and emerging technology.",
      applicationUrl: "https://a16z.com/about/jobs",
      deadline: new Date("2026-10-15T00:00:00Z"),
      isPaid: true,
      salary: "$7,000/month",
      tags: ["Investing", "Finance", "Entrepreneurship"],
      source: "LinkedIn",
      sourceUrl: "https://a16z.com/about/jobs",
    },
    {
      title: "Backend Engineering Intern",
      company: "PlanetScale",
      location: "Remote",
      isRemote: true,
      description:
        "Work on distributed database infrastructure powering thousands of production applications. Deep-dive into MySQL internals, connection pooling, and horizontal scalability. Strong CS fundamentals required.",
      applicationUrl: "https://planetscale.com/careers",
      deadline: new Date("2026-09-30T00:00:00Z"),
      isPaid: true,
      salary: "$8,500/month",
      tags: ["Software Engineering"],
      source: "LinkedIn",
      sourceUrl: "https://planetscale.com/careers",
    },
    {
      title: "Operations & Strategy Intern",
      company: "Ramp",
      location: "New York, NY",
      isRemote: false,
      description:
        "Drive operational efficiency initiatives and contribute to strategic planning at Ramp. Work directly with senior leadership on projects spanning finance, growth, and product operations.",
      applicationUrl: "https://ramp.com/careers",
      deadline: new Date("2026-09-01T00:00:00Z"),
      isPaid: true,
      salary: "$6,000/month",
      tags: ["Operations", "Finance"],
      source: "LinkedIn",
      sourceUrl: "https://ramp.com/careers",
    },
  ]

  for (const internship of internships) {
    await prisma.internship.upsert({
      where: {
        id: `seed-intern-${internship.company.toLowerCase().replace(/\s+/g, "-")}-${internship.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`,
      },
      update: {},
      create: {
        id: `seed-intern-${internship.company.toLowerCase().replace(/\s+/g, "-")}-${internship.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`,
        ...internship,
      },
    })
  }

  console.log(`Seeded ${internships.length} internships.`)
  console.log("Done!")
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
