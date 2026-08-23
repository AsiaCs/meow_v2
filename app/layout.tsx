import type { Metadata } from "next"
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"

// ── Display: Bricolage Grotesque ────────────────────────────────────────────
// Variable grotesque with irregular widths and a slightly off-grid character.
// Chosen because it does NOT read as the default geometric sans every product
// in this category ships with, and it holds up under the heavy negative
// tracking the display scale applies. Also carries the wordmark.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
})

// ── Text / UI: IBM Plex Sans ────────────────────────────────────────────────
// Humane grotesque with real character that still survives at 13–15px in dense
// listing rows. Deliberately a different tonal register from the display face
// rather than a second geometric sans.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
})

// ── Numerics: IBM Plex Mono ─────────────────────────────────────────────────
// Same superfamily as the text face, so it is not a third voice. Used only for
// figures — dates, salary, deadlines, match scores — where tabular alignment
// between rows actually matters.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
})

const siteUrl = "https://usemeow.co"

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
    <html lang="en" className={`${plexSans.variable} ${bricolage.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh bg-bg-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
