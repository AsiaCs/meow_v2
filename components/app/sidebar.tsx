"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Home, Calendar, Briefcase, Plus, LogOut, User, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { MeowLockup } from "@/components/brand/meow-lockup"

// Floating glass sidebar — port of meow-web.jsx Dashboard().
// 268px wide, 16px margin around, .glass surface, 24px radius. Active row
// is .glass-2 with a brand-accent icon. User card at the bottom in a
// glass-2 plate with a gradient avatar swatch.

interface SidebarProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const navItems = [
  { href: "/dashboard", label: "Discover", icon: Home },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/internships", label: "Internships", icon: Briefcase },
  { href: "/profile", label: "Saved", icon: Bookmark },
  { href: "/submit", label: "Host an event", icon: Plus },
]

function SideItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 rounded-[13px] transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        active
          ? "glass-2 text-text-primary"
          : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]",
      )}
    >
      <Icon
        size={21}
        strokeWidth={active ? 2 : 1.7}
        className={active ? "text-purple" : "text-text-secondary"}
      />
      <span className={cn("text-[15px]", active ? "font-bold" : "font-semibold")}>
        {label}
      </span>
    </Link>
  )
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/auth/signin"
  }

  return (
    <>
      {/* Desktop sidebar — floating glass, 268px wide, 16px margin */}
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 w-[268px] flex-col glass rounded-[24px] p-4 z-40">
        {/* Wordmark — sized to fit comfortably inside the 268px sidebar. */}
        <div className="px-2.5 pt-1 pb-5">
          <Link href="/dashboard" className="inline-flex items-center">
            <MeowLockup iconSize={26} wordmarkSize={19} gap={9} />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <SideItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)
              }
            />
          ))}
        </nav>

        {/* User card — glass-2 plate with gradient avatar swatch */}
        <div className="mt-auto pt-3 space-y-1.5">
          <Link
            href="/profile"
            className="glass-2 flex items-center gap-3 rounded-[16px] p-3.5 group"
          >
            <div
              className="w-[38px] h-[38px] rounded-[11px] flex-shrink-0 overflow-hidden flex items-center justify-center text-text-primary text-sm font-bold"
              style={{ background: "linear-gradient(160deg, #c98bf6, #6366f1)" }}
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name ?? "User"} className="w-full h-full object-cover" />
              ) : (
                <span>{(user.name?.charAt(0) ?? "U").toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-bold text-text-primary truncate">
                {user.name ?? "You"}
              </div>
              <div className="text-[12.5px] font-medium text-text-muted truncate">
                {user.email}
              </div>
            </div>
            <User size={14} strokeWidth={1.5} className="text-text-muted group-hover:text-text-secondary flex-shrink-0" />
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[13px] w-full text-left text-[13.5px] font-semibold text-text-secondary hover:text-red-400 hover:bg-red-400/[0.06] transition-colors duration-200"
          >
            <LogOut size={17} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <MobileNav pathname={pathname} />
    </>
  )
}

function MobileNav({ pathname }: { pathname: string }) {
  const mobileItems = navItems.slice(0, 4)
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 glass-2 rounded-[26px] px-2 py-2.5 flex items-center justify-around">
      {mobileItems.map((item) => {
        const Icon = item.icon
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl flex-1 transition-colors duration-200",
              active ? "text-text-primary" : "text-text-muted",
            )}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2 : 1.7}
              className={active ? "text-purple" : ""}
            />
            <span className={cn("text-[10.5px]", active ? "font-bold" : "font-semibold")}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
