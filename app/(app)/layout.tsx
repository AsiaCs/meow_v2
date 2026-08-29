import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/app/sidebar"

// Auth shell. Flat bg-bg-base from the root layout, same as every other
// surface in the rebuild — the aurora + room wash this used to carry is
// retired (see nav.tsx / footer.tsx for the same call on the marketing side).

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
  )
}
