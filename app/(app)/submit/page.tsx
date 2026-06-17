"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TimePicker } from "@/components/ui/time-picker"
import { ImageUploader } from "@/components/events/image-uploader"
import { INTEREST_AREAS, cn } from "@/lib/utils"

const schema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    // Time is now mandatory — was the source of the "stored a day earlier"
    // bug when users left it blank and we defaulted to 00:00 local, which
    // crossed midnight in UTC.
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
    isVirtual: z.boolean(),
    location: z.string().optional(),
    virtualLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    registrationUrl: z.string().url("Must be a valid URL"),
    tags: z.array(z.string()).min(1, "Pick at least one interest").max(5, "Max 5 interests"),
    isFree: z.boolean(),
    imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.isVirtual && !data.location) return false
      return true
    },
    { message: "Location is required for in-person events", path: ["location"] }
  )

type FormValues = z.infer<typeof schema>

// Backend issue → human-friendly field label for the error banner.
const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  startDate: "Start Date",
  startTime: "Start Time",
  endDate: "End Date",
  location: "Location",
  virtualLink: "Virtual Meeting Link",
  registrationUrl: "Registration / RSVP URL",
  imageUrl: "Image URL",
  tags: "Interest Areas",
  isVirtual: "Virtual toggle",
  isFree: "Free toggle",
}

interface ServerIssue {
  path?: string
  message?: string
}

export default function SubmitEventPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      isVirtual: false,
      isFree: true,
      tags: [],
    },
  })

  const isVirtual = watch("isVirtual")
  const isFree = watch("isFree")
  const selectedTags = watch("tags")

  const MAX_TAGS = 5

  function toggleTag(tag: string) {
    const current = selectedTags ?? []
    if (current.includes(tag)) {
      setValue("tags", current.filter((t) => t !== tag), { shouldValidate: true })
    } else {
      if (current.length >= MAX_TAGS) return
      setValue("tags", [...current, tag], { shouldValidate: true })
    }
  }

  function buildPayload(data: FormValues) {
    // Combine date + REQUIRED time into an ISO 8601 string. Zod guarantees
    // startTime matches /^\d{2}:\d{2}$/ before we get here so the bare
    // fallback only fires if a malformed payload sneaks past validation.
    const time = data.startTime?.trim() || "12:00"
    const localDt = new Date(`${data.startDate}T${time}`)
    const startIso = isNaN(localDt.getTime())
      ? new Date(`${data.startDate}T12:00:00`).toISOString()
      : localDt.toISOString()

    // Strip empty strings from optional URL fields so they don't trip URL
    // validation server-side. This was the second cause of the old
    // "Validation failed" red banner.
    const clean = <T,>(v: T | undefined | "" | null): T | undefined =>
      v === "" || v == null ? undefined : v

    return {
      title: data.title.trim(),
      description: clean(data.description?.trim()),
      startDate: startIso,
      isVirtual: data.isVirtual,
      location: clean(data.location?.trim()),
      virtualLink: clean(data.virtualLink?.trim()),
      registrationUrl: data.registrationUrl.trim(),
      tags: data.tags,
      isFree: data.isFree,
      imageUrl: clean(data.imageUrl?.trim()),
    }
  }

  async function onSubmit(data: FormValues) {
    setServerError("")
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        // NOTE: do NOT add Authorization: Bearer here. We use Supabase SSR
        // which authenticates via the sb-* cookies set during sign-in.
        // Fetch with same-origin credentials automatically — no header needed.
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(data)),
      })
      if (!res.ok) {
        let text = ""
        let issues: ServerIssue[] = []
        let topError = "Submission failed"
        let dbCode: string | null = null
        let dbMessage: string | null = null
        let dbHint: string | null = null
        try {
          const body = (await res.json()) as {
            error?: string
            issues?: ServerIssue[]
            db?: { code?: string | null; message?: string | null; hint?: string | null }
            hint?: string
          }
          if (body.error) topError = body.error
          if (Array.isArray(body.issues)) issues = body.issues
          dbCode = body.db?.code ?? null
          dbMessage = body.db?.message ?? null
          dbHint = body.hint ?? body.db?.hint ?? null
        } catch {
          text = await res.text().catch(() => "")
        }

        if (issues.length > 0) {
          const formatted = issues
            .map((i) => {
              const label = i.path ? FIELD_LABELS[i.path] ?? i.path : "Field"
              return `${label}: ${i.message ?? "invalid"}`
            })
            .slice(0, 4)
            .join("  •  ")
          setServerError(`${topError} — ${formatted}`)
        } else if (dbCode || dbMessage || dbHint) {
          // 500 from the DB layer — surface the actual Postgres code + message
          // so we can fix the schema/RLS without guessing.
          const parts: string[] = [topError]
          if (dbHint) parts.push(dbHint)
          if (dbCode || dbMessage) {
            parts.push(`[${dbCode ?? "?"}] ${dbMessage ?? ""}`.trim())
          }
          setServerError(parts.filter(Boolean).join("  •  "))
        } else {
          setServerError(text ? `${topError}: ${text.slice(0, 200)}` : topError)
        }
        return
      }
      setSubmitted(true)
    } catch (e) {
      setServerError(`Network error: ${e instanceof Error ? e.message : "try again"}`)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 mx-auto mb-6">
            <CheckCircle size={28} strokeWidth={1.5} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary font-display mb-3">
            Event Submitted!
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-8">
            Your event is live on the Events page right now. Tap below to see it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                // Hard navigation (not router.push) forces the events page to
                // re-mount with a fresh fetch — bypasses any stale React state
                // or browser HTTP cache from a previous visit.
                window.location.href = "/events"
              }}
            >
              See it on the Events page →
            </Button>
            <Button variant="ghost" onClick={() => setSubmitted(false)}>
              Submit another event
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary font-display">Submit an Event</h1>
        <p className="text-text-secondary text-sm mt-1.5">
          Share an event with the community. All submissions are reviewed before publishing.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-6">
            {/* Title */}
            <Input
              label="Event Title"
              requiredMark
              placeholder="e.g. SF AI Founders Dinner"
              error={errors.title?.message}
              {...register("title")}
            />

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Description
              </label>
              <textarea
                placeholder="What's this event about? Who should attend?"
                rows={4}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 transition-all resize-none"
                {...register("description")}
              />
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                requiredMark
                type="date"
                error={errors.startDate?.message}
                {...register("startDate")}
              />
              <Controller
                name="startTime"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TimePicker
                    label="Start Time"
                    required
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={errors.startTime?.message}
                  />
                )}
              />
            </div>

            {/* Virtual toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl glass-2">
              <div>
                <p className="text-sm font-medium text-text-primary">Virtual Event</p>
                <p className="text-xs text-text-muted mt-0.5">Toggle on if this event is online</p>
              </div>
              <Controller
                name="isVirtual"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors duration-200",
                      field.value ? "bg-purple" : "bg-bg-elevated border border-border-strong"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                        field.value ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                )}
              />
            </div>

            {/* Location or virtual link */}
            {isVirtual ? (
              <Input
                label="Virtual Meeting Link"
                placeholder="https://zoom.us/..."
                error={errors.virtualLink?.message}
                {...register("virtualLink")}
              />
            ) : (
              <Input
                label="Location"
                requiredMark
                placeholder="e.g. San Francisco, CA"
                error={errors.location?.message}
                {...register("location")}
              />
            )}

            {/* Registration URL */}
            <Input
              label="Registration / RSVP URL"
              requiredMark
              placeholder="https://lu.ma/..."
              error={errors.registrationUrl?.message}
              {...register("registrationUrl")}
            />

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary flex items-center justify-between">
                <span>
                  Interest Areas
                  <span className="text-red-400 ml-1" aria-hidden="true">*</span>
                </span>
                <span className="text-[11px] text-text-muted font-normal">
                  {(selectedTags?.length ?? 0)}/{MAX_TAGS}
                </span>
              </label>
              {errors.tags && (
                <p className="text-xs text-red-400">{errors.tags.message}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {INTEREST_AREAS.map((area) => {
                  const active = selectedTags?.includes(area)
                  return (
                    <button
                      type="button"
                      key={area}
                      onClick={() => toggleTag(area)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
                        active
                          ? "border-purple bg-purple/15 text-purple-light"
                          : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary"
                      )}
                    >
                      {area}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Free toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl glass-2">
              <div>
                <p className="text-sm font-medium text-text-primary">Free Event</p>
                <p className="text-xs text-text-muted mt-0.5">Is this event free to attend?</p>
              </div>
              <Controller
                name="isFree"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors duration-200",
                      field.value ? "bg-purple" : "bg-bg-elevated border border-border-strong"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                        field.value ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                )}
              />
            </div>

            {/* Cover image — file upload to Supabase Storage. Falls back to
                the neon date thumbnail on the feed card when left blank. */}
            <Controller
              name="imageUrl"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <ImageUploader
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />

            {serverError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                <X size={14} strokeWidth={1.5} />
                {serverError}
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button type="submit" loading={isSubmitting} className="ml-auto">
              Submit Event
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
