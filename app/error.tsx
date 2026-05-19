"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🐾</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Something went wrong
        </h1>
        <p className="text-text-secondary text-sm mb-6 max-w-sm">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white cursor-pointer transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-secondary border border-white/[0.08] hover:bg-white/[0.04] transition-all"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
