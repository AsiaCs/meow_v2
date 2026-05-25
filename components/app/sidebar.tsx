"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Home,
  Calendar,
  Briefcase,
  Users,
  PlusCircle,
  LogOut,
  User,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/canvas", label: "Canvas", icon: Sparkles },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/internships", label: "Internships", icon: Briefcase },
  { href: "/people", label: "People", icon: Users },
  { href: "/submit", label: "Submit Event", icon: PlusCircle },
]

function NavLink({
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
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
        active
          ? "text-white"
          : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
      )}
      style={
        active
          ? { background: "var(--gradient-brand)" }
          : undefined
      }
    >
      <Icon size={18} strokeWidth={1.5} />
      {label}
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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col bg-bg-surface border-r border-border z-40">
        {/* Logo */}
        <div className="px-5 py-6">
          <Link href="/dashboard">
            <span className="gradient-text font-display text-2xl font-bold tracking-tight">
              meow
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
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

        {/* User section */}
        <div className="px-3 pb-5 pt-4 border-t border-border space-y-1">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-bg-elevated border border-border-strong">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name ?? "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs font-semibold">
                  {user.name?.charAt(0).toUpperCase() ?? "U"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user.name ?? "User"}
              </p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
            </div>
            <User size={14} strokeWidth={1.5} className="text-text-muted group-hover:text-text-secondary transition-colors flex-shrink-0" />
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left text-sm text-text-secondary hover:text-red-400 hover:bg-red-400/[0.06] transition-all duration-150"
          >
            <LogOut size={18} strokeWidth={1.5} />
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
  const mobileItems = navItems.slice(0, 5)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-surface border-t border-border">
      <div className="flex items-center justify-around px-2 py-2">
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
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 flex-1",
                active ? "text-purple" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
