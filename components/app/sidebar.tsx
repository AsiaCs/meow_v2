"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  House,
  CalendarBlank,
  Briefcase,
  Plus,
  SignOut,
  CaretRight,
  BookmarkSimple,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { MeowWordmark } from "@/components/brand/meow-wordmark"

// Floating sidebar. A hairline plate, no shadow: this system separates with
// whitespace first and hairlines second.
//
// The active row carries three signals, not one: the raised surface, the accent
// icon, and aria-current. Colour alone never communicated which row was active,
// which left a screen reader user no way to tell at all.

interface SidebarProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const navItems = [
  { href: "/dashboard", label: "Discover", icon: House },
  { href: "/events", label: "Events", icon: CalendarBlank },
  { href: "/internships", label: "Internships", icon: Briefcase },
  { href: "/profile", label: "Saved", icon: BookmarkSimple },
  { href: "/submit", label: "Host an event", icon: Plus },
]

type IconType = (typeof navItems)[number]["icon"]

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)
}

function SideItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: IconType
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 min-h-11 rounded-control",
        "transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        active
          ? "bg-bg-raised text-text-primary"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-raised",
      )}
    >
      <Icon
        size={21}
        weight={active ? "fill" : "regular"}
        className={active ? "text-accent" : "text-text-muted"}
        aria-hidden="true"
      />
      <span className={cn("text-body", active ? "font-semibold" : "font-medium")}>
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
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 w-[268px] flex-col rounded-panel border border-border-subtle bg-bg-raised p-4 z-40">
        <div className="px-2.5 pt-1 pb-5">
          <Link href="/dashboard" className="inline-flex rounded-control">
            <MeowWordmark size={19} />
            <span className="sr-only">meow, dashboard</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto" aria-label="Main">
          {navItems.map((item) => (
            <SideItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>

        <div className="mt-auto pt-3 space-y-1.5">
          <Link
            href="/profile"
            className="group flex items-center gap-3 rounded-panel border border-border-subtle bg-bg-raised p-3.5 transition-colors hover:bg-bg-sunken"
          >
            <div className="w-[38px] h-[38px] rounded-control flex-shrink-0 overflow-hidden flex items-center justify-center bg-bg-inverse text-text-inverse text-body font-semibold">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span aria-hidden="true">{(user.name?.charAt(0) ?? "U").toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body font-semibold text-text-primary truncate">
                {user.name ?? "You"}
              </div>
              <div className="text-meta font-medium text-text-muted truncate">
                {user.email}
              </div>
            </div>
            <CaretRight
              size={14}
              weight="bold"
              className="text-text-muted group-hover:text-text-secondary flex-shrink-0"
              aria-hidden="true"
            />
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3.5 py-2.5 min-h-11 rounded-control w-full text-left text-body font-medium text-text-secondary transition-colors hover:text-critical hover:bg-critical/10"
          >
            <SignOut size={17} weight="regular" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <MobileNav pathname={pathname} />
    </>
  )
}

function MobileNav({ pathname }: { pathname: string }) {
  const mobileItems = navItems.slice(0, 4)
  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed bottom-3 left-3 right-3 z-40 rounded-panel border border-border-subtle bg-bg-raised px-2 py-2 flex items-center justify-around"
    >
      {mobileItems.map((item) => {
        const Icon = item.icon
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              // 44px minimum touch target, which the previous py-1.5 rows
              // did not reliably clear on smaller devices.
              "flex flex-col items-center justify-center gap-1 px-3 py-1.5 min-h-11 rounded-control flex-1 transition-colors duration-200",
              active ? "text-text-primary" : "text-text-muted",
            )}
          >
            <Icon
              size={22}
              weight={active ? "fill" : "regular"}
              className={active ? "text-accent" : undefined}
              aria-hidden="true"
            />
            <span className={cn("text-meta", active ? "font-semibold" : "font-medium")}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
