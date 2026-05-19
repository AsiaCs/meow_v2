import { scrapeCerebralValley, type ScrapedEvent } from "./cerebralvalley"
import { scrapeLuma } from "./luma"
import { scrapeInternships, type ScrapedInternship } from "./internships"
import { prisma } from "@/lib/db"

async function saveEvents(events: ScrapedEvent[]): Promise<number> {
  let saved = 0
  for (const ev of events) {
    try {
      // Use findFirst + upsert-by-id pattern since sourceUrl has no @unique constraint
      const existing = ev.sourceUrl
        ? await prisma.event.findFirst({ where: { sourceUrl: ev.sourceUrl }, select: { id: true } })
        : null

      if (existing) {
        await prisma.event.update({
          where: { id: existing.id },
          data: {
            title: ev.title,
            description: ev.description ?? "",
            startDate: ev.startDate,
            endDate: ev.endDate,
            location: ev.location,
            isVirtual: ev.isVirtual,
            registrationUrl: ev.registrationUrl,
            imageUrl: ev.imageUrl,
            tags: ev.tags,
            source: ev.source,
            isFree: ev.isFree,
          },
        })
      } else {
        await prisma.event.create({
          data: {
            title: ev.title,
            description: ev.description ?? "",
            startDate: ev.startDate,
            endDate: ev.endDate,
            location: ev.location,
            isVirtual: ev.isVirtual,
            registrationUrl: ev.registrationUrl,
            imageUrl: ev.imageUrl,
            tags: ev.tags,
            source: ev.source,
            sourceUrl: ev.sourceUrl,
            isFree: ev.isFree,
            status: "APPROVED", // Scraped events are auto-approved
          },
        })
      }
      saved++
    } catch {
      // Skip individual failures — don't abort the whole batch
    }
  }
  return saved
}

async function saveInternships(internships: ScrapedInternship[]): Promise<number> {
  let saved = 0
  for (const intern of internships) {
    try {
      const existing = intern.applicationUrl
        ? await prisma.internship.findFirst({
            where: { applicationUrl: intern.applicationUrl },
            select: { id: true },
          })
        : null

      if (existing) {
        await prisma.internship.update({
          where: { id: existing.id },
          data: {
            title: intern.title,
            company: intern.company,
            location: intern.location,
            isRemote: intern.isRemote,
            description: intern.description ?? "",
            isPaid: intern.isPaid,
            tags: intern.tags,
            source: intern.source,
            sourceUrl: intern.sourceUrl,
          },
        })
      } else {
        await prisma.internship.create({
          data: {
            title: intern.title,
            company: intern.company,
            location: intern.location,
            isRemote: intern.isRemote,
            description: intern.description ?? "",
            applicationUrl: intern.applicationUrl ?? "",
            isPaid: intern.isPaid,
            tags: intern.tags,
            source: intern.source,
            sourceUrl: intern.sourceUrl,
          },
        })
      }
      saved++
    } catch {
      // Skip individual failures
    }
  }
  return saved
}

export async function runAllScrapers(interests: string[] = []) {
  const [cvResult, lumaResult, internshipsResult] = await Promise.allSettled([
    scrapeCerebralValley(),
    scrapeLuma("networking tech"),
    scrapeInternships(interests),
  ])

  const cvEvents: ScrapedEvent[] =
    cvResult.status === "fulfilled" ? cvResult.value : []
  const lumaEvents: ScrapedEvent[] =
    lumaResult.status === "fulfilled" ? lumaResult.value : []
  const internships: ScrapedInternship[] =
    internshipsResult.status === "fulfilled" ? internshipsResult.value : []

  const allEvents = [...cvEvents, ...lumaEvents]

  const [eventsSaved, internshipsSaved] = await Promise.all([
    saveEvents(allEvents),
    saveInternships(internships),
  ])

  return {
    success: true,
    stats: {
      cerebralValley: cvEvents.length,
      luma: lumaEvents.length,
      internships: internships.length,
      eventsSaved,
      internshipsSaved,
    },
  }
}
