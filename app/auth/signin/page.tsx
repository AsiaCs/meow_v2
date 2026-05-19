"use client"

import { motion } from "framer-motion"
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

export default function SignInPage() {
  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
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
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>m</span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Welcome to Meow
              </h1>
              <p className="text-text-secondary text-sm">
                Sign in to discover opportunities tailored to you
              </p>
            </div>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 text-text-primary font-medium cursor-pointer"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <p className="text-center text-xs text-text-muted mt-6">
              By signing in, you agree to our{" "}
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
