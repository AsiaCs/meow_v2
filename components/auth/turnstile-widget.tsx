"use client"

import { useEffect, useRef } from "react"

// Public site key (safe to ship — it appears in the page HTML by design).
// Env override wins if set.
const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "0x4AAAAAAD_ddqXI9ePtFRhr"

interface TurnstileGlobal {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string
      callback: (token: string) => void
      "error-callback"?: () => void
      "expired-callback"?: () => void
      theme?: "light" | "dark" | "auto"
    },
  ) => string
  reset: (id?: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileGlobal
  }
}

const SCRIPT_ID = "cf-turnstile-script"

/**
 * Cloudflare Turnstile widget. Calls onToken with a verification token the
 * server checks against TURNSTILE_SECRET_KEY. Renders nothing if no site key.
 */
export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false

    const renderWidget = () => {
      if (cancelled || !ref.current || !window.turnstile) return
      if (widgetId.current) return // already rendered
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        callback: (token) => onToken(token),
        "error-callback": () => onToken(""),
        "expired-callback": () => onToken(""),
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script")
      s.id = SCRIPT_ID
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      s.async = true
      s.defer = true
      s.onload = renderWidget
      document.head.appendChild(s)
    } else {
      // Script tag exists but API not ready yet — poll briefly.
      const t = setInterval(() => {
        if (window.turnstile) {
          clearInterval(t)
          renderWidget()
        }
      }, 200)
      return () => clearInterval(t)
    }

    return () => {
      cancelled = true
    }
  }, [onToken])

  if (!SITE_KEY) return null
  return <div ref={ref} className="flex justify-center" />
}
