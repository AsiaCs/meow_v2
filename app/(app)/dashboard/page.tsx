import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight, CalendarDots as CalendarDays, Briefcase } from "@phosphor-icons/react/dist/ssr"
import { EventCard } from "@/components/events/event-card"
import { InternshipCard } from "@/components/internships/internship-card"
import { stableEventId } from "@/lib/events/source"
import { fetchListedEvents } from "@/lib/events/listing"
import { filterReachable } from "@/lib/validators/links"
import { isSpecificApplyUrl } from "@/lib/validators/specific-urls"

export const runtime = "nodejs"
export const revalidate = 1800


function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function SectionHeader({
  title,
  icon: Icon,
  href,
}: {
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-text-muted" aria-hidden="true" />
        <h2 className="font-display text-heading-m text-text-primary">{title}</h2>
      </div>
      <Link
        href={href}
        className="link-underline flex items-center gap-1 text-body text-text-secondary transition-colors hover:text-text-primary"
      >
        View all
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="border border-border-subtle rounded-panel p-8 text-center bg-bg-raised">
      <p className="text-text-muted text-body">{message}</p>
    </div>
  )
}

type DashboardInternship = {
  id: string
  title: string
  company: string
  location: string | null
  isRemote: boolean
  deadline: string | null
  isPaid: boolean | null
  salary: string | null
  tags: string[]
  applicationUrl: string
}

type DashboardProfile = {
  location?: string | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/signin")

  const [{ data: internshipsRaw }, { data: profileRaw }] = await Promise.all([
    supabase
      .from("internships")
      .select("id, title, company, location, isRemote, deadline, isPaid, salary, tags, applicationUrl")
      .order("createdAt", { ascending: false })
      .limit(20),
    supabase
      .from("users")
      .select("location, interests")
      .eq("id", user.id)
      .single(),
  ])

  const profile = profileRaw as DashboardProfile | null
  const userLocation = profile?.location ?? null
  const userCity = userLocation?.split(",")[0]?.trim().toLowerCase() ?? null

  // Read the same payload /events renders. Calling getAllEvents() here gave
  // this page its own unstable_cache fill (see lib/events/listing.ts) — one
  // so stale that a single far-future event survived the filter below while
  // the listing showed 46.
  const scrapedEvents = await fetchListedEvents()
  const now = new Date()
  const futureEvents = scrapedEvents.filter((e) => new Date(e.startDate) > now)

  // Bias by user's city
  const nearbyEvents = userCity
    ? futureEvents.filter((e) => e.location?.toLowerCase().includes(userCity))
    : []
  const virtualEvents = futureEvents.filter((e) => e.isVirtual && !nearbyEvents.includes(e))
  const otherEvents = futureEvents.filter((e) => !nearbyEvents.includes(e) && !virtualEvents.includes(e))
  const events = [...nearbyEvents, ...virtualEvents, ...otherEvents].slice(0, 6)

  // Validate internship URLs: must point at specific apply pages AND be reachable
  const dbInternships = Array.isArray(internshipsRaw) ? (internshipsRaw as DashboardInternship[]) : []
  const specificInternships = dbInternships.filter((i) => isSpecificApplyUrl(i.applicationUrl))
  const validInternships = await filterReachable(specificInternships, (i) => i.applicationUrl)
  const internships = validInternships.slice(0, 6)

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "there"

  return (
    <div className="min-h-dvh">
      <div className="px-6 pt-8 pb-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-heading-l text-text-primary">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-3 max-w-[52ch] text-lead text-text-secondary">
            What is coming up near you, and which roles are still open.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-2 pb-8 space-y-12">
        <section>
          <SectionHeader title="Upcoming events" icon={CalendarDays} href="/events" />
          {events.length === 0 ? (
            <EmptySection message="No verified events right now. We re-scrape every 30 minutes, so try again shortly." />
          ) : (
            <div className="flex flex-col gap-3">
              {events.slice(0, 5).map((event) => (
                <EventCard
                  key={stableEventId(event.registrationUrl)}
                  id={stableEventId(event.registrationUrl)}
                  title={event.title}
                  description={event.description ?? undefined}
                  startDate={new Date(event.startDate).toISOString()}
                  location={event.location ?? undefined}
                  isVirtual={event.isVirtual}
                  registrationUrl={event.registrationUrl}
                  imageUrl={event.imageUrl ?? undefined}
                  tags={event.tags}
                  isFree={event.isFree}
                  source={event.source}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Open internships" icon={Briefcase} href="/internships" />
          {internships.length === 0 ? (
            <EmptySection message="No internships right now. We only list roles whose application link we could verify." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {internships.map((internship: DashboardInternship) => (
                <InternshipCard
                  key={internship.id}
                  id={internship.id}
                  title={internship.title}
                  company={internship.company}
                  location={internship.location ?? undefined}
                  isRemote={internship.isRemote}
                  deadline={internship.deadline ?? undefined}
                  isPaid={internship.isPaid ?? undefined}
                  salary={internship.salary ?? undefined}
                  tags={internship.tags}
                  applicationUrl={internship.applicationUrl}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
