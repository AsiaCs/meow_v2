import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight, CalendarDays, Briefcase } from "lucide-react"
import { EventCard } from "@/components/events/event-card"
import { InternshipCard } from "@/components/internships/internship-card"
import { getAllEvents, stableEventId } from "@/lib/events/source"
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
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  href: string
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <Icon size={18} strokeWidth={1.5} className="text-purple" />
        <h2 className="text-lg font-semibold text-text-primary font-display">{title}</h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-purple transition-colors"
      >
        View all
        <ArrowRight size={14} strokeWidth={1.5} />
      </Link>
    </div>
  )
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="border border-white/[0.06] rounded-2xl p-8 text-center bg-white/[0.01]">
      <div className="text-3xl mb-3">🐾</div>
      <p className="text-text-muted text-sm">{message}</p>
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

  // Live-scrape events (cached 30 min) and validate URLs
  const scrapedEvents = await getAllEvents()
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
    <div className="min-h-dvh bg-bg-base">
      <div className="border-b border-border bg-bg-surface px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary font-display">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-text-secondary mt-1.5 text-sm leading-relaxed">
            Here&apos;s what&apos;s happening in your network. Discover opportunities tailored to you.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-12">
        <section>
          <SectionHeader title="Upcoming Events" icon={CalendarDays} href="/events" />
          {events.length === 0 ? (
            <EmptySection message="No verified events at the moment — try again later as we re-scrape every 30 minutes." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
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
          <SectionHeader title="Internship Listings" icon={Briefcase} href="/internships" />
          {internships.length === 0 ? (
            <EmptySection message="No internships available right now — we only show listings with verified application links." />
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
