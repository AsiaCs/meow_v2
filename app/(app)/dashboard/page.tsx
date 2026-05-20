import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight, Sparkles, CalendarDays, Briefcase, Users } from "lucide-react"
import { EventCard } from "@/components/events/event-card"
import { InternshipCard } from "@/components/internships/internship-card"
import { PersonCard } from "@/components/people/person-card"
import { CURATED_INTERNSHIPS, getCuratedEvents, hasGoodUrl } from "@/lib/data/curated"

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/signin")

  const [{ data: eventsRaw }, { data: internshipsRaw }, { data: peopleRaw }, { data: profileRaw }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, description, startDate, endDate, location, isVirtual, registrationUrl, imageUrl, tags, isFree, source")
      .eq("status", "APPROVED")
      .gte("startDate", new Date().toISOString())
      .order("startDate")
      .limit(20),
    supabase
      .from("internships")
      .select("id, title, company, location, isRemote, deadline, isPaid, salary, tags, applicationUrl")
      .order("createdAt", { ascending: false })
      .limit(6),
    supabase
      .from("users")
      .select("id, name, location, interests")
      .eq("onboarded", true)
      .neq("id", user.id)
      .order("createdAt", { ascending: false })
      .limit(4),
    supabase
      .from("users")
      .select("location, interests")
      .eq("id", user.id)
      .single(),
  ])

  const userLocation = (profileRaw as any)?.location as string | null ?? null
  const userCity = userLocation?.split(",")[0]?.trim().toLowerCase() ?? null

  // Merge DB events with curated fallback, filter bad URLs and past events
  const dbEvents = (eventsRaw ?? []).filter((e: any) => hasGoodUrl(e.registrationUrl))
  const curatedEvents = getCuratedEvents()
  const seenEventTitles = new Set(dbEvents.map((e: any) => e.title.toLowerCase()))
  const fallbackEvents = curatedEvents.filter(e => !seenEventTitles.has(e.title.toLowerCase()))
  const allEvents = [...dbEvents, ...fallbackEvents]

  const nearbyEvents = userCity
    ? allEvents.filter(e => e.location?.toLowerCase().includes(userCity))
    : []
  const virtualEvents = allEvents.filter(e => e.isVirtual && !nearbyEvents.includes(e))
  const otherEvents = allEvents.filter(e => !nearbyEvents.includes(e) && !virtualEvents.includes(e))
  const events = [...nearbyEvents, ...virtualEvents, ...otherEvents].slice(0, 6)

  // Merge DB internships (filter bad URLs) with curated fallback
  const dbInternships = (internshipsRaw ?? []).filter((i: any) => hasGoodUrl(i.applicationUrl))
  const seenInternships = new Set(dbInternships.map((i: any) => `${i.company}|${i.title}`))
  const fallbackInternships = CURATED_INTERNSHIPS.filter(
    i => !seenInternships.has(`${i.company}|${i.title}`)
  )
  const internships = [...dbInternships, ...fallbackInternships].slice(0, 6)

  const people = peopleRaw ?? []

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "there"

  return (
    <div className="min-h-dvh bg-bg-base">
      {/* Header */}
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
        {/* Events */}
        <section>
          <SectionHeader title="Upcoming Events" icon={CalendarDays} href="/events" />
          {events.length === 0 ? (
            <EmptySection message="We're still loading opportunities for you. Check back soon!" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  description={event.description ?? undefined}
                  startDate={event.startDate}
                  location={event.location ?? undefined}
                  isVirtual={event.isVirtual}
                  registrationUrl={event.registrationUrl ?? undefined}
                  imageUrl={event.imageUrl ?? undefined}
                  tags={event.tags}
                  isFree={event.isFree}
                  source={event.source}
                />
              ))}
            </div>
          )}
        </section>

        {/* Internships */}
        <section>
          <SectionHeader title="Internship Listings" icon={Briefcase} href="/internships" />
          {internships.length === 0 ? (
            <EmptySection message="No internships yet — we're sourcing the best opportunities." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {internships.map((internship) => (
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

        {/* People */}
        <section>
          <SectionHeader title="People to Connect With" icon={Users} href="/people" />
          {people.length === 0 ? (
            <EmptySection message="No profiles yet — be the first to complete your profile!" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {people.map((person) => (
                <PersonCard
                  key={person.id}
                  id={person.id}
                  name={person.name ?? "Anonymous"}
                  location={person.location ?? undefined}
                  interests={person.interests}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
