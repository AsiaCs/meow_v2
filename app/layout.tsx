import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Sora } from "next/font/google"
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

export const metadata: Metadata = {
  title: "Meow — Find Your Next Opportunity",
  description:
    "Discover internships and networking events near you. Meow connects ambitious people with the opportunities that matter.",
  openGraph: {
    title: "Meow — Find Your Next Opportunity",
    description: "Discover internships and networking events near you.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${sora.variable}`}>
      <body className="min-h-dvh bg-bg-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
