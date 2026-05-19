"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, CheckCircle, ArrowRight, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { INTEREST_AREAS, cn } from "@/lib/utils"

type LookingFor = "internships" | "events" | "mentors" | "all"

const LOOKING_FOR_OPTIONS: {
  value: LookingFor
  label: string
  emoji: string
  description: string
}[] = [
  {
    value: "internships",
    label: "Internships",
    emoji: "💼",
    description: "Find opportunities to gain experience",
  },
  {
    value: "events",
    label: "Events",
    emoji: "📅",
    description: "Discover networking events and workshops",
  },
  {
    value: "mentors",
    label: "Mentors",
    emoji: "🧑‍🏫",
    description: "Connect with industry professionals",
  },
  {
    value: "all",
    label: "Everything",
    emoji: "✨",
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
    <div className="min-h-dvh bg-bg-base flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="mb-10 text-center">
        <span className="gradient-text font-display text-3xl font-bold tracking-tight">
          meow
        </span>
        <p className="text-text-muted text-sm mt-2">Let&apos;s personalize your experience</p>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                  i < step
                    ? "bg-purple text-white"
                    : i === step
                    ? "border-2 border-purple text-purple"
                    : "border border-border text-text-muted"
                )}
              >
                {i < step ? <CheckCircle size={14} strokeWidth={2} /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  i <= step ? "text-text-secondary" : "text-text-muted"
                )}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--gradient-brand)" }}
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
                <h2 className="text-2xl font-bold text-text-primary font-display">
                  What are you interested in?
                </h2>
                <p className="text-text-secondary text-sm mt-1.5">
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
                        "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150",
                        active
                          ? "text-white border-transparent"
                          : "border-border text-text-secondary hover:border-border-strong hover:text-text-primary"
                      )}
                      style={active ? { background: "var(--gradient-brand)" } : undefined}
                    >
                      {area}
                    </button>
                  )
                })}
              </div>
              {selectedInterests.length > 0 && (
                <p className="text-xs text-text-muted">
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
                <h2 className="text-2xl font-bold text-text-primary font-display">
                  Where are you based?
                </h2>
                <p className="text-text-secondary text-sm mt-1.5">
                  We&apos;ll use this to surface local events and opportunities.
                </p>
              </div>

              <div className="relative">
                <MapPin
                  size={16}
                  strokeWidth={1.5}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="City, State or Region"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={remoteFirst}
                  className="w-full bg-bg-surface border border-border rounded-xl pl-9 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 transition-all disabled:opacity-40"
                />
              </div>

              <button
                onClick={() => setRemoteFirst(!remoteFirst)}
                className={cn(
                  "flex items-center gap-3 w-full p-4 rounded-xl border transition-all duration-150 text-left",
                  remoteFirst
                    ? "border-purple bg-purple/10"
                    : "border-border hover:border-border-strong"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    remoteFirst ? "border-purple" : "border-border-strong"
                  )}
                >
                  {remoteFirst && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Wifi size={14} strokeWidth={1.5} className="text-purple" />
                    <p className="text-sm font-medium text-text-primary">
                      I&apos;m remote-first
                    </p>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
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
                <h2 className="text-2xl font-bold text-text-primary font-display">
                  What are you looking for?
                </h2>
                <p className="text-text-secondary text-sm mt-1.5">
                  We&apos;ll customize your feed based on your goals.
                </p>
              </div>

              <div className="space-y-3">
                {LOOKING_FOR_OPTIONS.map(({ value, label, emoji, description }) => {
                  const active = lookingFor.includes(value)
                  return (
                    <button
                      key={value}
                      onClick={() => toggleLookingFor(value)}
                      className={cn(
                        "flex items-center gap-4 w-full p-4 rounded-xl border transition-all duration-150 text-left",
                        active
                          ? "border-purple bg-purple/10"
                          : "border-border hover:border-border-strong"
                      )}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">{label}</p>
                        <p className="text-xs text-text-muted mt-0.5">{description}</p>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          active ? "border-purple" : "border-border-strong"
                        )}
                      >
                        {active && (
                          <div className="w-2.5 h-2.5 rounded-full bg-purple" />
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
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {error && <p className="text-xs text-red-400 flex-1 mx-4">{error}</p>}

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
