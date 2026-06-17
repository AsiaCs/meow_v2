import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/app/sidebar"
import { Aurora, Room } from "@/components/landing/aurora"

// Auth shell. Every signed-in surface (events, internships, profile, submit)
// inherits the brand background — aurora + room wash — from this layout so
// the design system is consistent across the dashboards, not just the landing.

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/signin")

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Brand background — fixed beneath all dashboard content */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Room />
        <Aurora />
      </div>

      <div className="relative z-10 flex min-h-dvh">
        <Sidebar
          user={{
            id: user.id,
            name: user.user_metadata?.full_name ?? null,
            email: user.email ?? null,
            image: user.user_metadata?.avatar_url ?? null,
          }}
        />
        <main className="flex-1 min-w-0 ml-0 md:ml-[284px] min-h-dvh pb-20 md:pb-4 md:pr-4 md:pt-4">
          {children}
        </main>
      </div>
    </div>
  )
}
