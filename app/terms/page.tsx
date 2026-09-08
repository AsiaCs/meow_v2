import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr"
import { MeowWordmark } from "@/components/brand/meow-wordmark"

export const metadata: Metadata = {
  title: "Terms of Service for Meow",
  description: "The terms that govern your use of Meow.",
}

const UPDATED = "July 26, 2026"

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-bg-base text-text-primary">
      <div className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
        <div className="mb-12 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <MeowWordmark size={20} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-body text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={15} />
            Back to home
          </Link>
        </div>

        <h1 className="font-display text-heading-l sm:text-heading-l font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-3 text-body text-text-muted">Last updated: {UPDATED}</p>

        <div className="mt-10 space-y-9 text-body leading-relaxed text-text-secondary [&_h2]:font-display [&_h2]:text-text-primary [&_h2]:font-semibold [&_h2]:text-heading-m [&_h2]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-0 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-text-primary [&_strong]:font-semibold">
          <section>
            <p>
              These terms are an agreement between you and Meow. By creating an account or using the
              service, you agree to them. If you don&apos;t agree, please don&apos;t use Meow.
            </p>
          </section>

          <section>
            <h2>Who can use Meow</h2>
            <p>
              You must be at least 16 years old to use Meow. You&apos;re responsible for keeping your
              account credentials secure and for everything that happens under your account.
            </p>
          </section>

          <section>
            <h2>What you can post</h2>
            <p>
              Meow lets you build a profile and submit events to a shared directory. You keep
              ownership of what you post, and you grant us a license to display it within the service.
              You agree not to submit content that is false, spammy, unlawful, infringing, or that
              impersonates someone else. We review submissions and may remove listings, or accounts,
              that break these rules.
            </p>
          </section>

          <section>
            <h2>About the listings</h2>
            <p>
              Events and internships shown in Meow are aggregated from public sources and community
              submissions. We work to keep application links accurate and to remove dead or expired
              listings, but we don&apos;t guarantee that any opportunity is available, current, or
              legitimate. Always verify details with the organization directly before applying or
              attending.
            </p>
          </section>

          <section>
            <h2>Paid plans</h2>
            <p>
              Meow may offer an optional paid tier. If you subscribe, billing is handled by Stripe and
              recurs until you cancel. You can cancel anytime; access continues through the end of the
              paid period. Fees are non-refundable except where required by law.
            </p>
          </section>

          <section>
            <h2>Acceptable use</h2>
            <p>
              Don&apos;t scrape, overload, reverse-engineer, or attempt to gain unauthorized access to
              Meow or its data, and don&apos;t use it to harass others or violate anyone&apos;s rights.
              We may suspend accounts that do.
            </p>
          </section>

          <section>
            <h2>Disclaimers &amp; liability</h2>
            <p>
              Meow is provided &ldquo;as is,&rdquo; without warranties of any kind. To the fullest
              extent permitted by law, we are not liable for indirect or consequential damages, or for
              opportunities you find (or miss) through the service. Nothing here limits liability that
              can&apos;t be limited by law.
            </p>
          </section>

          <section>
            <h2>Changes &amp; termination</h2>
            <p>
              We may update these terms; if we make material changes we&apos;ll update the date above.
              You can stop using Meow anytime, and we may suspend or end accounts that violate these
              terms. See our <Link href="/privacy">Privacy Policy</Link> for how we handle your data.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions about these terms? Email{" "}
              <a href="mailto:privacy.meow.app@gmail.com">privacy.meow.app@gmail.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-16 border-t border-border-subtle pt-8 text-body text-text-muted">
          <Link href="/privacy" className="text-text-secondary hover:text-text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="mx-3">·</span>
          <span>© {new Date().getFullYear()} Meow</span>
        </div>
      </div>
    </main>
  )
}
