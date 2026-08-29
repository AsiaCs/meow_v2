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
        <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
          Something went wrong
        </h1>
        <p className="text-text-secondary text-sm mb-6 max-w-sm">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-brand">
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-secondary border border-border hover:bg-bg-surface transition-all"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
