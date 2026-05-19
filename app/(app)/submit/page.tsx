"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { INTEREST_AREAS, cn } from "@/lib/utils"

const schema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    startTime: z.string().optional(),
    isVirtual: z.boolean(),
    location: z.string().optional(),
    virtualLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    registrationUrl: z.string().url("Must be a valid URL"),
    tags: z.array(z.string()).min(1, "Select at least one tag"),
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

  function toggleTag(tag: string) {
    const current = selectedTags ?? []
    if (current.includes(tag)) {
      setValue("tags", current.filter((t) => t !== tag), { shouldValidate: true })
    } else {
      setValue("tags", [...current, tag], { shouldValidate: true })
    }
  }

  async function onSubmit(data: FormValues) {
    setServerError("")
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Submission failed" }))
        setServerError(err.error ?? "Something went wrong")
        return
      }
      setSubmitted(true)
    } catch {
      setServerError("Network error. Please try again.")
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
            Thanks for contributing to the community. Your event is under review and
            will appear on the events page once approved.
          </p>
          <Button variant="primary" onClick={() => setSubmitted(false)}>
            Submit another event
          </Button>
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
                className="bg-bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 transition-all resize-none"
                {...register("description")}
              />
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                error={errors.startDate?.message}
                {...register("startDate")}
              />
              <Input
                label="Start Time (optional)"
                type="time"
                {...register("startTime")}
              />
            </div>

            {/* Virtual toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-surface">
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
                placeholder="e.g. San Francisco, CA"
                error={errors.location?.message}
                {...register("location")}
              />
            )}

            {/* Registration URL */}
            <Input
              label="Registration / RSVP URL"
              placeholder="https://lu.ma/..."
              error={errors.registrationUrl?.message}
              {...register("registrationUrl")}
            />

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary">
                Interest Areas
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
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-surface">
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

            {/* Image URL */}
            <Input
              label="Image URL (optional)"
              placeholder="https://..."
              error={errors.imageUrl?.message}
              {...register("imageUrl")}
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
