import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Award, Layers, Users } from "lucide-react"

function LinkedInIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

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

function isRealLinkedIn(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const { hostname, pathname } = new URL(url)
    return (hostname === "linkedin.com" || hostname === "www.linkedin.com") &&
      pathname.startsWith("/in/") && pathname.length > 5
  } catch { return false }
}

export default async function PersonProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: person, error } = await supabase
    .from("users")
    .select(`id, name, image, location, interests, linkedinUrl, experiences!experiences_userId_fkey(id, type, title, organization, description, skills, current, startDate, endDate)`)
    .eq("id", id)
    .eq("onboarded", true)
    .single()

  if (error || !person) notFound()

  const experiences = Array.isArray((person as any).experiences)
    ? (person as any).experiences
    : []
  const isMentor = experiences.some((e: any) => e.type === "WORK")
  const linkedinUrl = isRealLinkedIn((person as any).linkedinUrl) ? (person as any).linkedinUrl : null

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
              {(person as any).image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(person as any).image}
                  alt={(person as any).name ?? ""}
                  className="w-20 h-20 rounded-2xl object-cover border border-border-strong flex-shrink-0"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  {((person as any).name ?? "?").charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-text-primary font-display">
                    {(person as any).name}
                  </h1>
                  {isMentor && <Badge variant="purple">Mentor</Badge>}
                </div>

                {(person as any).location && (
                  <div className="flex items-center gap-1.5 text-sm text-text-muted mt-1.5">
                    <MapPin size={13} strokeWidth={1.5} />
                    {(person as any).location}
                  </div>
                )}

                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-medium border border-[#0077B5]/40 text-[#0077B5] hover:bg-[#0077B5]/10 transition-colors"
                  >
                    <LinkedInIcon />
                    Connect on LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interests */}
        {(person as any).interests?.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
              Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {(person as any).interests.map((interest: string, i: number) => (
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
              {experiences.map((exp: any) => {
                const Icon = EXP_ICONS[exp.type] ?? Briefcase
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
                          {Array.isArray(exp.skills) && exp.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {exp.skills.map((skill: string) => (
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
