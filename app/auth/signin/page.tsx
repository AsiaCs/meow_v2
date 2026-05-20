"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
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
    setLoading(true)

    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, mode }),
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
    <main className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/[0.06] p-2 bg-white/[0.02]">
          <div className="bg-bg-card rounded-[calc(1.5rem-0.375rem)] p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div
                className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
              >
                <span className="text-white font-bold text-lg font-display">m</span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2 font-display">
                Welcome to Meow
              </h1>
              <p className="text-text-secondary text-sm">
                {mode === "signin"
                  ? "Sign in to discover opportunities tailored to you"
                  : "Create your account and get started"}
              </p>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 text-text-primary font-medium cursor-pointer"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email/password form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-bg-base border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 transition-all"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-bg-base border border-border rounded-xl px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword
                    ? <EyeOff size={16} strokeWidth={1.5} />
                    : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
                  {error}
                </p>
              )}
              {successMsg && (
                <p className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2.5">
                  {successMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            {/* Mode toggle */}
            <p className="text-center text-sm text-text-muted mt-5">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                className="text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>

            <p className="text-center text-xs text-text-muted mt-4">
              By continuing, you agree to our{" "}
              <a href="#" className="text-text-secondary hover:text-text-primary transition-colors">Terms</a>
              {" "}and{" "}
              <a href="#" className="text-text-secondary hover:text-text-primary transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
