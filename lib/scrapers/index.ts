import { scrapeCerebralValley, type ScrapedEvent } from "./cerebralvalley"
import { scrapeLuma } from "./luma"
import { scrapeInternships, type ScrapedInternship } from "./internships"
import { createClient } from "@/lib/supabase/server"
import { filterReachable } from "@/lib/validators/links"
import { isSpecificApplyUrl, isSpecificEventUrl } from "@/lib/validators/specific-urls"

async function saveEvents(events: ScrapedEvent[]): Promise<number> {
  const supabase = await createClient()
  let saved = 0
  for (const ev of events) {
    try {
      if (ev.sourceUrl) {
        const { data: existing } = await supabase
          .from("events")
          .select("id")
          .eq("sourceUrl", ev.sourceUrl)
          .maybeSingle()

        if (existing) {
          await supabase.from("events").update({
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
          }).eq("id", existing.id)
        } else {
          await supabase.from("events").insert({
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
            status: "APPROVED",
          })
        }
      } else {
        await supabase.from("events").insert({
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
          status: "APPROVED",
        })
      }
      saved++
    } catch {
      // Skip individual failures
    }
  }
  return saved
}

async function saveInternships(internships: ScrapedInternship[]): Promise<number> {
  const supabase = await createClient()
  let saved = 0
  for (const intern of internships) {
    try {
      if (intern.applicationUrl) {
        const { data: existing } = await supabase
          .from("internships")
          .select("id")
          .eq("applicationUrl", intern.applicationUrl)
          .maybeSingle()

        if (existing) {
          await supabase.from("internships").update({
            title: intern.title,
            company: intern.company,
            location: intern.location,
            isRemote: intern.isRemote,
            description: intern.description ?? "",
            isPaid: intern.isPaid,
            tags: intern.tags,
            source: intern.source,
            sourceUrl: intern.sourceUrl,
          }).eq("id", existing.id)
        } else {
          await supabase.from("internships").insert({
            title: intern.title,
            company: intern.company,
            location: intern.location,
            isRemote: intern.isRemote,
            description: intern.description ?? "",
            applicationUrl: intern.applicationUrl,
            isPaid: intern.isPaid,
            tags: intern.tags,
            source: intern.source,
            sourceUrl: intern.sourceUrl,
          })
        }
      } else {
        await supabase.from("internships").insert({
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
        })
      }
      saved++
    } catch {
      // Skip individual failures
    }
  }
  return saved
}

export async function runAllScrapers(interests: string[] = [], city?: string) {
  const [cvResult, lumaResult, internshipsResult] = await Promise.allSettled([
    scrapeCerebralValley(),
    scrapeLuma("networking tech startup", city),
    scrapeInternships(interests),
  ])

  const cvEvents: ScrapedEvent[] =
    cvResult.status === "fulfilled" ? cvResult.value : []
  const lumaEvents: ScrapedEvent[] =
    lumaResult.status === "fulfilled" ? lumaResult.value : []
  const rawInternships: ScrapedInternship[] =
    internshipsResult.status === "fulfilled" ? internshipsResult.value : []

  // Validate links before saving — filter out dead/unreachable URLs
  const [validEvents, validInternships] = await Promise.all([
    filterReachable(
      [...cvEvents, ...lumaEvents].filter((e) => isSpecificEventUrl(e.registrationUrl)),
      (e) => e.registrationUrl,
    ),
    filterReachable(
      rawInternships.filter((i) => isSpecificApplyUrl(i.applicationUrl)),
      (i) => i.applicationUrl,
    ),
  ])

  const [eventsSaved, internshipsSaved] = await Promise.all([
    saveEvents(validEvents),
    saveInternships(validInternships),
  ])

  return {
    success: true,
    stats: {
      cerebralValley: cvEvents.length,
      luma: lumaEvents.length,
      internships: rawInternships.length,
      validEvents: validEvents.length,
      validInternships: validInternships.length,
      eventsSaved,
      internshipsSaved,
    },
  }
}
