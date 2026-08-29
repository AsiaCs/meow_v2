import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MeowWordmark } from "@/components/brand/meow-wordmark"

export const metadata: Metadata = {
  title: "Privacy Policy — Meow",
  description:
    "How Meow collects, uses, and protects your data — account info, profile details, and the opportunities you save.",
}

const UPDATED = "July 26, 2026"

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-bg-base text-text-primary">
      <div className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
        <div className="mb-12 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <MeowWordmark size={20} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={15} strokeWidth={1.75} />
            Back to home
          </Link>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-text-muted">Last updated: {UPDATED}</p>

        <div className="mt-10 space-y-9 text-[15px] leading-relaxed text-text-secondary [&_h2]:font-display [&_h2]:text-text-primary [&_h2]:font-bold [&_h2]:text-xl [&_h2]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-0 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-text-primary [&_strong]:font-semibold">
          <section>
            <p>
              Meow helps students and early-career builders discover events, internships, and
              people worth knowing. This policy explains exactly what we collect, why, and the
              control you have over it. We keep it plain because you should be able to read it.
            </p>
          </section>

          <section>
            <h2>Information you give us</h2>
            <ul className="list-disc space-y-2 pl-5 marker:text-text-faint">
              <li>
                <strong>Account details.</strong> When you sign up with email, we store your email
                address and a securely hashed password (handled by our authentication provider,
                Supabase — we never see or store your raw password). If you sign in with Google, we
                receive your name, email address, and profile photo from Google.
              </li>
              <li>
                <strong>Profile.</strong> Anything you add to your profile — display name, location,
                interests, LinkedIn URL, and the work or project experience you list.
              </li>
              <li>
                <strong>Your activity.</strong> Events and internships you save, and events you
                submit to the directory.
              </li>
              <li>
                <strong>Email preferences.</strong> Whether you&apos;ve opted in to the weekly
                opportunity digest.
              </li>
            </ul>
          </section>

          <section>
            <h2>Information collected automatically</h2>
            <p>
              Our hosting provider (Vercel) and database provider (Supabase) process standard
              technical data needed to run the service — IP address, browser type, and request
              timestamps — for security, abuse prevention, and reliability. We do not use
              third-party advertising or cross-site tracking cookies. The only cookies we set are the
              session cookies that keep you signed in.
            </p>
          </section>

          <section>
            <h2>How we use your information</h2>
            <ul className="list-disc space-y-2 pl-5 marker:text-text-faint">
              <li>To create your account and keep you signed in.</li>
              <li>To personalize the opportunities and events we surface for you.</li>
              <li>To send the weekly digest, only if you&apos;ve opted in (you can opt out anytime).</li>
              <li>To keep the directory accurate and prevent spam or abuse.</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data, and we do not share it with advertisers.
            </p>
          </section>

          <section>
            <h2>Who we share data with</h2>
            <p>
              We share data only with the service providers that make Meow work:{" "}
              <strong>Supabase</strong> (authentication and database), <strong>Vercel</strong>{" "}
              (hosting), <strong>Google</strong> (only if you choose Google sign-in), and, if you
              upgrade to a paid plan, <strong>Stripe</strong> (payment processing — Meow never sees
              your card number). Each processes data on our behalf under their own terms. We may also
              disclose information if required by law.
            </p>
          </section>

          <section>
            <h2>Your choices and rights</h2>
            <ul className="list-disc space-y-2 pl-5 marker:text-text-faint">
              <li>Edit or clear your profile information at any time from your profile page.</li>
              <li>Unsubscribe from the digest using the link in any digest email or your settings.</li>
              <li>
                Request deletion of your account and associated data by emailing us at the address
                below. We&apos;ll remove your data within 30 days, except where we&apos;re required to
                retain it.
              </li>
            </ul>
          </section>

          <section>
            <h2>Data retention &amp; security</h2>
            <p>
              We keep your data for as long as your account is active. Data is stored on
              infrastructure operated by Supabase and Vercel, encrypted in transit (HTTPS) and at
              rest. No system is perfectly secure, but we restrict access to your data and follow
              least-privilege practices for who and what can read it.
            </p>
          </section>

          <section>
            <h2>Children</h2>
            <p>
              Meow is intended for users 16 and older. We do not knowingly collect data from
              children under 16. If you believe a child has provided us data, contact us and
              we&apos;ll delete it.
            </p>
          </section>

          <section>
            <h2>Changes to this policy</h2>
            <p>
              If we make material changes, we&apos;ll update the date above and, where appropriate,
              notify you in the app or by email. Continued use after a change means you accept the
              updated policy.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions about your privacy or a data request? Email{" "}
              <a href="mailto:privacy.meow.app@gmail.com">privacy.meow.app@gmail.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-16 border-t border-border-subtle pt-8 text-sm text-text-muted">
          <Link href="/terms" className="text-text-secondary hover:text-text-primary transition-colors">
            Terms of Service
          </Link>
          <span className="mx-3">·</span>
          <span>© {new Date().getFullYear()} Meow</span>
        </div>
      </div>
    </main>
  )
}
