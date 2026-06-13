import LandingNav from "@/components/landing/nav"
import Hero from "@/components/landing/hero"
import Footer from "@/components/landing/footer"

// Marketing landing = the meow UI.html canonical landing artboard, nothing else.
// Stripped: features (numbered editorial), how-it-works, rule-dot dividers,
// closing-cta. Those were Mobbin-pass additions, not part of the handoff design.

export default function LandingPage() {
  return (
    <main className="bg-bg-base">
      <LandingNav />
      <Hero />
      <Footer />
    </main>
  )
}
