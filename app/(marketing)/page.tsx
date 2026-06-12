import LandingNav from "@/components/landing/nav"
import Hero from "@/components/landing/hero"
import Features from "@/components/landing/features"
import HowItWorks from "@/components/landing/how-it-works"
import Footer from "@/components/landing/footer"

// Section divider — Mobbin signature hairline with a centered dot.
// Sits between sections to give the page an editorial cadence without
// adding decoration.
function RuleDot() {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="rule-dot" aria-hidden="true" />
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="bg-bg-base">
      <LandingNav />
      <Hero />
      <RuleDot />
      <Features />
      <RuleDot />
      <HowItWorks />
      <Footer />
    </main>
  )
}
