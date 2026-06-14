import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Urbanist, Poppins, Instrument_Serif } from "next/font/google"
import "./globals.css"

// Instrument Serif — editorial display serif in the Perplexity register.
// Loaded across both 400 weights, italic + roman, for the H1 and accents.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
})

// Urbanist replaces Sora as the display face — same geometric grotesk family,
// tighter apertures, the Mobbin-style high-contrast look. Loaded across the
// weights actually used (regular through extrabold) so the date-thumb glyph
// and h1/h2 headings render correctly at production weight.
const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-urbanist",
  display: "swap",
})

// Used by the meow wordmark — Poppins ExtraBold per the v2 logo handoff.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
})

const siteUrl = "https://meow-two-pied.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "meow — Find Your Next Opportunity",
  description:
    "Discover internships and networking events near you. Meow connects ambitious people with the opportunities that matter.",
  // Auto-uses /app/icon.svg + /app/apple-icon.png. The svg variant scales
  // to every density without us shipping a dozen sizes.
  icons: {
    icon: [
      { url: "/meow-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/meow-icon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "meow — Find Your Next Opportunity",
    description: "Discover internships and networking events near you.",
    type: "website",
    url: siteUrl,
    siteName: "meow",
    images: ["/meow-icon.svg"],
  },
  twitter: {
    card: "summary",
    title: "meow",
    description: "Discover internships and networking events near you.",
    images: ["/meow-icon.svg"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${urbanist.variable} ${poppins.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-dvh bg-bg-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
