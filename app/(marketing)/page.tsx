import LandingNav from "@/components/landing/nav"
import Hero from "@/components/landing/hero"
import Features from "@/components/landing/features"
import HowItWorks from "@/components/landing/how-it-works"
import Footer from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="bg-bg-base">
      <LandingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <Footer />
    </main>
  )
}
