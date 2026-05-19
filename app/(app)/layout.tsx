import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/app/sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/signin")

  return (
    <div className="flex min-h-dvh bg-bg-base">
      <Sidebar user={{ id: user.id, name: user.user_metadata?.full_name ?? null, email: user.email ?? null, image: user.user_metadata?.avatar_url ?? null }} />
      <main className="flex-1 ml-0 md:ml-60 min-h-dvh pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
