"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { MeowWordmark } from "@/components/brand/meow-wordmark"
import { Button } from "@/components/ui/button"
import { TurnstileWidget } from "@/components/auth/turnstile-widget"

// ── Sign in ─────────────────────────────────────────────────────────────────
//
// Was a floating glass card over the (retired) Aurora blob background — both
// gone. Depth here comes the same way it does everywhere else in the rebuild:
// a flat bordered panel on the base surface, no blur, no glow (shadow-card is
// literally `none` in the token set). The icon lockup is dropped for the same
// reason nav.tsx and footer.tsx drop it — meow-logo.tsx is still the old
// rainbow glyph and hasn't been carried over to the brass system.

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

type Mode = "signin" | "signup"

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState("")

  const handleGoogleSignIn = async () => {
    try {
      setError(null)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      })
      if (error) setError(error.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google")
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    // Bot protection: require a Turnstile token before creating an account.
    if (mode === "signup" && !turnstileToken) {
      setError("Please complete the verification below.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, mode, turnstileToken }),
      })

      let json: Record<string, unknown> = {}
      try {
        json = await res.json()
      } catch {
        setError("Server error — please try again.")
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError((json.error as string) ?? "Something went wrong. Please try again.")
        setLoading(false)
        return
      }

      if (json.confirm) {
        setSuccessMsg("Check your email for a confirmation link to complete sign-up.")
        setLoading(false)
        return
      }

      window.location.href = mode === "signup" ? "/onboarding" : "/dashboard"
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setSuccessMsg(null)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg-base px-4 py-16">
      <div className="enter w-full max-w-md" style={{ "--i": 0 } as React.CSSProperties}>
        <div className="rounded-2xl border border-border bg-bg-card p-8 md:p-10">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <Link href="/" aria-label="meow — home">
              <MeowWordmark size={26} />
            </Link>
            <h1 className="mt-5 font-display text-heading-l text-text-primary">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-body-m text-text-secondary">
              {mode === "signin"
                ? "Sign in to pick up where you left off."
                : "Set up your account and start showing up."}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-bg-surface px-6 py-3.5 font-medium text-text-primary transition-colors hover:bg-bg-elevated"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-meta uppercase tracking-[0.14em] text-text-faint">Or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-bg-surface px-4 py-3 text-body-m text-text-primary placeholder:text-text-muted transition-colors focus:border-border-accent"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-border bg-bg-surface px-4 py-3 pr-11 text-body-m text-text-primary placeholder:text-text-muted transition-colors focus:border-border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
              >
                {showPassword
                  ? <EyeOff size={16} strokeWidth={1.5} />
                  : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>

            {error && (
              <p className="rounded-lg border border-critical/20 bg-critical/10 px-3 py-2.5 text-meta text-critical">
                {error}
              </p>
            )}
            {successMsg && (
              <p className="rounded-lg border border-positive/20 bg-positive/10 px-3 py-2.5 text-meta text-positive">
                {successMsg}
              </p>
            )}

            {/* Bot protection on account creation only */}
            {mode === "signup" && (
              <div className="pt-1">
                <TurnstileWidget onToken={setTurnstileToken} />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="mt-1 w-full"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {/* Mode toggle */}
          <p className="mt-5 text-center text-body-m text-text-muted">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              className="link-underline font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>

          <p className="mt-4 text-center text-meta text-text-faint">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="link-underline text-text-secondary transition-colors hover:text-text-primary">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="link-underline text-text-secondary transition-colors hover:text-text-primary">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
