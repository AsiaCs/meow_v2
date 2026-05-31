import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Sora, Poppins } from "next/font/google"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
})

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
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
    <html lang="en" className={`${jakarta.variable} ${sora.variable} ${poppins.variable}`}>
      <body className="min-h-dvh bg-bg-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
