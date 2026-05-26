import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Award, Layers, Users, Globe, ExternalLink } from "lucide-react"

function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.02 0 0 .97-.31 3.18 1.18A11.07 11.07 0 0 1 12 6.81c.98.01 1.98.13 2.91.39 2.21-1.49 3.18-1.18 3.18-1.18.62 1.57.23 2.73.11 3.02.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}
import { pickBuildUrl } from "@/lib/url-helpers"
import { normalizeStringArray } from "@/lib/profile-normalization"

const EXP_TYPE_LABELS: Record<string, string> = {
  WORK: "Work",
  EDUCATION: "Education",
  PROJECT: "Project",
  CERTIFICATION: "Certification",
  EXTRACURRICULAR: "Extracurricular",
}

const EXP_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  WORK: Briefcase,
  EDUCATION: GraduationCap,
  CERTIFICATION: Award,
  PROJECT: Layers,
  EXTRACURRICULAR: Users,
}

const TAG_VARIANTS: Array<"purple" | "pink" | "green" | "gray"> = ["purple", "pink", "green", "gray"]

type PersonExperience = {
  id: string
  type: string
  title: string
  organization: string | null
  description: string | null
  skills: unknown
  current: boolean
  startDate: string | null
  endDate: string | null
}

type PersonRow = {
  id: string
  name: string | null
  image: string | null
  location: string | null
  interests: unknown
  githubUrl?: string | null
  portfolioUrl?: string | null
  experiences: unknown
}

export default async function PersonProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Try wide select with build URLs first; fall back to narrow if columns absent
  const wide = await supabase
    .from("users")
    .select(`id, name, image, location, interests, githubUrl, portfolioUrl, experiences!experiences_userId_fkey(id, type, title, organization, description, skills, current, startDate, endDate)`)
    .eq("id", id)
    .eq("onboarded", true)
    .single()

  let person: unknown = wide.data
  let error = wide.error

  if (error && /column .*(githubUrl|portfolioUrl).* does not exist/i.test(error.message ?? "")) {
    const fb = await supabase
      .from("users")
      .select(`id, name, image, location, interests, experiences!experiences_userId_fkey(id, type, title, organization, description, skills, current, startDate, endDate)`)
      .eq("id", id)
      .eq("onboarded", true)
      .single()
    person = fb.data
    error = fb.error
  }

  if (error || !person) notFound()

  const personRow = person as PersonRow
  const experiences = Array.isArray(personRow.experiences)
    ? (personRow.experiences as PersonExperience[])
    : []
  const isMentor = experiences.some((e) => e.type === "WORK")

  const build = pickBuildUrl(personRow.githubUrl, personRow.portfolioUrl)
  const interests = normalizeStringArray(personRow.interests)

  return (
    <div className="min-h-dvh bg-bg-base">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back */}
        <Link
          href="/people"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-6"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to People
        </Link>

        {/* Profile card */}
        <div className="border border-white/[0.06] rounded-3xl p-1.5 bg-white/[0.02] mb-6">
          <div className="bg-bg-card rounded-[calc(1.5rem-0.375rem)] p-6">
            <div className="flex items-start gap-5">
              {personRow.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={personRow.image}
                  alt={personRow.name ?? ""}
                  className="w-20 h-20 rounded-2xl object-cover border border-border-strong flex-shrink-0"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  {(personRow.name ?? "?").charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-text-primary font-display">
                    {personRow.name}
                  </h1>
                  {isMentor && <Badge variant="purple">Mentor</Badge>}
                </div>

                {personRow.location && (
                  <div className="flex items-center gap-1.5 text-sm text-text-muted mt-1.5">
                    <MapPin size={13} strokeWidth={1.5} />
                    {personRow.location}
                  </div>
                )}

                {build ? (
                  <a
                    href={build.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      build.kind === "github"
                        ? "inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-medium border border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/10 transition-colors"
                        : "inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-medium border border-purple/40 text-purple-light hover:bg-purple/10 transition-colors"
                    }
                  >
                    {build.kind === "github" ? (
                      <GithubIcon size={14} />
                    ) : (
                      <Globe size={14} strokeWidth={1.75} />
                    )}
                    {build.kind === "github" ? "View GitHub" : "View Build"}
                    <ExternalLink size={11} strokeWidth={1.75} className="opacity-60" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Interests */}
        {interests.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
              Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest: string, i: number) => (
                <Badge key={interest} variant={TAG_VARIANTS[i % TAG_VARIANTS.length]}>
                  {interest}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Experiences */}
        {experiences.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
              Experience
            </h2>
            <div className="space-y-3">
              {experiences.map((exp) => {
                const Icon = EXP_ICONS[exp.type] ?? Briefcase
                const skills = normalizeStringArray(exp.skills)
                return (
                  <div
                    key={exp.id}
                    className="border border-white/[0.06] rounded-2xl p-1.5 bg-white/[0.02]"
                  >
                    <div className="bg-bg-card rounded-[calc(1rem-0.375rem)] p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple/10 flex items-center justify-center flex-shrink-0">
                          <Icon size={16} strokeWidth={1.5} className="text-purple" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-text-primary leading-tight">
                                {exp.title}
                              </p>
                              {exp.organization && (
                                <p className="text-xs text-text-secondary mt-0.5">
                                  {exp.organization}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Badge variant="gray" className="text-[11px]">
                                {EXP_TYPE_LABELS[exp.type] ?? exp.type}
                              </Badge>
                              {exp.current && (
                                <Badge variant="green" className="text-[11px]">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </div>
                          {exp.description && (
                            <p className="text-xs text-text-muted mt-2 leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {skills.map((skill: string) => (
                                <span
                                  key={skill}
                                  className="px-2 py-0.5 rounded-md text-[11px] bg-white/[0.04] text-text-muted border border-white/[0.06]"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {experiences.length === 0 && (
          <div className="border border-white/[0.06] rounded-2xl p-8 text-center bg-white/[0.01]">
            <p className="text-text-muted text-sm">No experiences added yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
