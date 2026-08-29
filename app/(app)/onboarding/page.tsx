"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, CheckCircle, ArrowRight, Wifi, Briefcase, Calendar, Sparkles } from "lucide-react"
import { MeowWordmark } from "@/components/brand/meow-wordmark"
import { Button } from "@/components/ui/button"
import { INTEREST_AREAS, cn } from "@/lib/utils"

type LookingFor = "internships" | "events" | "all"

const LOOKING_FOR_OPTIONS: {
  value: LookingFor
  label: string
  icon: typeof Briefcase
  description: string
}[] = [
  {
    value: "internships",
    label: "Internships",
    icon: Briefcase,
    description: "Find opportunities to gain experience",
  },
  {
    value: "events",
    label: "Events",
    icon: Calendar,
    description: "Discover networking events and workshops",
  },
  {
    value: "all",
    label: "Everything",
    icon: Sparkles,
    description: "Show me all opportunities",
  },
]

const STEPS = ["Interests", "Location", "Goals"]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Step 1
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  // Step 2
  const [location, setLocation] = useState("")
  const [remoteFirst, setRemoteFirst] = useState(false)

  // Step 3
  const [lookingFor, setLookingFor] = useState<LookingFor[]>([])

  function toggleInterest(area: string) {
    setSelectedInterests((prev) =>
      prev.includes(area) ? prev.filter((i) => i !== area) : [...prev, area]
    )
  }

  function toggleLookingFor(val: LookingFor) {
    if (val === "all") {
      setLookingFor(["all"])
      return
    }
    setLookingFor((prev) => {
      const without = prev.filter((v) => v !== "all")
      return without.includes(val)
        ? without.filter((v) => v !== val)
        : [...without, val]
    })
  }

  function canProceed() {
    if (step === 0) return selectedInterests.length >= 1
    if (step === 1) return true
    if (step === 2) return lookingFor.length >= 1
    return true
  }

  async function handleFinish() {
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: selectedInterests,
          location: remoteFirst ? "Remote" : location,
          lookingFor,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error ?? "Something went wrong")
        return
      }
      router.push("/dashboard")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg-base px-6 py-12">
      {/* Wordmark — no icon lockup here; meow-logo.tsx is still the old
          rainbow glyph and hasn't been carried over to the brass system. */}
      <div className="mb-10 flex flex-col items-center text-center">
        <MeowWordmark size={30} />
        <p className="mt-4 text-body-m text-text-muted">Let&apos;s personalize your experience</p>
      </div>

      {/* Progress */}
      <div className="mb-8 w-full max-w-lg">
        <div className="mb-2 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                  i < step
                    ? "bg-brand text-on-brand"
                    : i === step
                    ? "border-2 border-brand text-brand"
                    : "border border-border text-text-muted"
                )}
              >
                {i < step ? <CheckCircle size={14} strokeWidth={2} /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  i <= step ? "text-text-secondary" : "text-text-muted"
                )}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
          <motion.div
            className="h-full rounded-full bg-text-primary"
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          />
        </div>
      </div>

      {/* Step panels */}
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-display text-heading-l text-text-primary">
                  What are you interested in?
                </h2>
                <p className="mt-1.5 text-body-m text-text-secondary">
                  Select all that apply. You can update these later.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTEREST_AREAS.map((area) => {
                  const active = selectedInterests.includes(area)
                  return (
                    <button
                      key={area}
                      onClick={() => toggleInterest(area)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        active
                          ? "border-transparent bg-text-primary text-bg-base"
                          : "border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary",
                      )}
                    >
                      {area}
                    </button>
                  )
                })}
              </div>
              {selectedInterests.length > 0 && (
                <p className="text-body-m text-text-muted">
                  {selectedInterests.length} selected
                </p>
              )}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-display text-heading-l text-text-primary">
                  Where are you based?
                </h2>
                <p className="mt-1.5 text-body-m text-text-secondary">
                  We&apos;ll use this to surface local events and opportunities.
                </p>
              </div>

              <div className="relative">
                <MapPin
                  size={16}
                  strokeWidth={1.5}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  placeholder="City, State or Region"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={remoteFirst}
                  className="w-full rounded-xl border border-border bg-bg-surface py-3 pl-9 pr-4 text-body-m text-text-primary placeholder:text-text-muted transition-all focus:border-border-accent disabled:opacity-40"
                />
              </div>

              <button
                onClick={() => setRemoteFirst(!remoteFirst)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-150",
                  remoteFirst
                    ? "border-brand bg-brand/10"
                    : "border-border hover:border-border-strong"
                )}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    remoteFirst ? "border-brand" : "border-border-strong"
                  )}
                >
                  {remoteFirst && (
                    <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Wifi size={14} strokeWidth={1.5} className="text-brand" />
                    <p className="text-body-m font-medium text-text-primary">
                      I&apos;m remote-first
                    </p>
                  </div>
                  <p className="mt-0.5 text-meta text-text-muted">
                    Prioritize remote and virtual opportunities
                  </p>
                </div>
              </button>

            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-display text-heading-l text-text-primary">
                  What are you looking for?
                </h2>
                <p className="mt-1.5 text-body-m text-text-secondary">
                  We&apos;ll customize your feed based on your goals.
                </p>
              </div>

              <div className="space-y-3">
                {LOOKING_FOR_OPTIONS.map(({ value, label, icon: Icon, description }) => {
                  const active = lookingFor.includes(value)
                  return (
                    <button
                      key={value}
                      onClick={() => toggleLookingFor(value)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-150",
                        active
                          ? "border-brand bg-brand/10"
                          : "border-border hover:border-border-strong"
                      )}
                    >
                      <Icon size={20} strokeWidth={1.5} className="flex-shrink-0 text-text-muted" />
                      <div className="flex-1">
                        <p className="text-body-m font-medium text-text-primary">{label}</p>
                        <p className="mt-0.5 text-meta text-text-muted">{description}</p>
                      </div>
                      <div
                        className={cn(
                          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          active ? "border-brand" : "border-border-strong"
                        )}
                      >
                        {active && (
                          <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-body-m text-text-muted transition-colors hover:text-text-secondary"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {error && <p className="mx-4 flex-1 text-meta text-critical">{error}</p>}

          {step < STEPS.length - 1 ? (
            <Button
              variant="primary"
              disabled={!canProceed()}
              onClick={() => setStep(step + 1)}
              className="gap-1.5"
            >
              Next
              <ArrowRight size={15} strokeWidth={1.5} />
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={!canProceed()}
              loading={submitting}
              onClick={handleFinish}
            >
              Get started
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
