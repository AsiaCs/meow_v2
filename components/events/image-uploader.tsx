"use client"

// Drop-in file uploader for the submit form. Replaces the old "Image URL"
// text input. On file select:
//   1. Validates type (image/*) + size (≤ 8 MB) client-side
//   2. Uploads to Supabase Storage bucket `event-banners`
//   3. Calls onChange with the resulting public URL
//
// If the user clears their selection or the upload fails, onChange("") is
// called and the submit pipeline falls back to the neon date thumbnail.
//
// REQUIRED ONE-TIME SETUP IN SUPABASE:
//   • Create bucket `event-banners` (Dashboard → Storage → New bucket)
//   • Make it PUBLIC (so the rendered cards can <img src={publicUrl} /> without a token)
//   • Policy: authenticated users INSERT to bucket_id = 'event-banners'

import { useId, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload, X, ImageIcon, AlertCircle } from "lucide-react"

interface ImageUploaderProps {
  value: string                          // current public URL
  onChange: (publicUrl: string) => void
  label?: string
  className?: string
  /** Max file size in megabytes. Default 8. */
  maxSizeMB?: number
}

const BUCKET = "event-banners"

export function ImageUploader({
  value,
  onChange,
  label = "Cover image",
  className,
  maxSizeMB = 8,
}: ImageUploaderProps) {
  const id = useId()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)

    if (!file.type.startsWith("image/")) {
      setError("Pick an image file (.jpg, .png, .webp, etc.).")
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMB} MB. Yours is ${(file.size / 1_048_576).toFixed(1)} MB.`)
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const userPrefix = user?.id ?? "anon"
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      // Path keeps uploads per-user + cache-bust by timestamp + random.
      const path = `${userPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: "31536000",   // 1y — public URLs include the random path so collisions are impossible
          upsert: false,
          contentType: file.type,
        })
      if (upErr) {
        setError(`Upload failed: ${upErr.message}`)
        return
      }

      // Public URL works because the bucket is configured as PUBLIC in
      // the Supabase dashboard. If the bucket is private, swap to
      // .createSignedUrl(path, 60 * 60 * 24 * 365).
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      if (!data.publicUrl) {
        setError("Could not resolve the public URL for the upload.")
        return
      }
      onChange(data.publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function clear() {
    onChange("")
    setError(null)
  }

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-secondary flex items-center justify-between"
        >
          <span>{label} <span className="text-text-muted">(optional)</span></span>
          {value && (
            <button
              type="button"
              onClick={clear}
              className="text-[11px] text-text-muted hover:text-text-primary inline-flex items-center gap-1 transition-colors"
            >
              <X size={11} strokeWidth={1.75} />
              Remove
            </button>
          )}
        </label>
      )}

      {value ? (
        // Preview pill — shows the uploaded image as a 96x96 thumb
        <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-border bg-bg-surface p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Cover preview"
            className="w-16 h-16 rounded-lg object-cover border border-border"
            onError={() => setError("Preview failed to load — the upload URL may be invalid.")}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary font-medium">Uploaded</p>
            <p className="text-[11px] text-text-muted truncate">{value}</p>
          </div>
        </div>
      ) : (
        // Drop zone — wrapped <label> so the entire box is the click target
        <label
          htmlFor={id}
          className={`mt-1.5 group flex items-center justify-center gap-3 rounded-xl border border-dashed border-border hover:border-brand/60 bg-bg-surface/50 hover:bg-bg-surface px-4 py-6 cursor-pointer transition-colors ${
            uploading ? "opacity-70 cursor-wait" : ""
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="text-brand animate-spin" />
              <span className="text-sm text-text-secondary">Uploading…</span>
            </>
          ) : (
            <>
              <Upload size={18} strokeWidth={1.5} className="text-text-muted group-hover:text-brand transition-colors" />
              <div className="text-left">
                <p className="text-sm text-text-primary font-medium">Drop an image or click to upload</p>
                <p className="text-[11px] text-text-muted">PNG, JPG, or WEBP · up to {maxSizeMB} MB</p>
              </div>
            </>
          )}
          <input
            id={id}
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
              // reset so picking the same file again still fires the event
              e.target.value = ""
            }}
            className="sr-only"
          />
        </label>
      )}

      {!value && (
        <p className="text-[11px] text-text-muted mt-1.5 flex items-center gap-1">
          <ImageIcon size={10} strokeWidth={1.5} />
          Skip this and we'll show a neon date thumbnail on the feed card.
        </p>
      )}

      {error && (
        <p className="text-xs text-critical mt-1.5 flex items-center gap-1">
          <AlertCircle size={11} strokeWidth={1.75} />
          {error}
        </p>
      )}
    </div>
  )
}
