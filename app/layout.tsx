import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

// ── Inter, everywhere ───────────────────────────────────────────────────────
// An explicit choice, not a fallback, which matters because Inter is the most
// common default-AI typeface and reads as one when it is used carelessly.
//
// What makes it deliberate here is the restraint around it: weights stop at
// 600 and headings sit at 500, tracking tightens as size grows and opens at
// body size, and the scale plus the whitespace carry the impression rather
// than the typeface. See the type scale in globals.css.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
})

const siteUrl = "https://usemeow.co"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "meow: every AI event and internship, in one index",
  description:
    "Talks, hackathons and mixers pulled from Luma and Cerebral Valley, alongside open roles. Filtered to your city, sorted by what happens next.",
  icons: {
    icon: [{ url: "/meow-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/meow-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "meow: every AI event and internship, in one index",
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-bg-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
