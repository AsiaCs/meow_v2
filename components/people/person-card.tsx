"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, Star, User } from "lucide-react"

function LinkedInIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { truncate } from "@/lib/utils"

interface PersonCardProps {
  id: string
  name: string
  image?: string
  role?: string
  location?: string
  interests: string[]
  linkedinUrl?: string
  bio?: string
  isMentor?: boolean
}

const tagVariants: Array<"purple" | "pink" | "green" | "gray"> = [
  "purple",
  "pink",
  "green",
  "gray",
]

function GradientAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
      style={{ background: "var(--gradient-brand)" }}
    >
      {initial}
    </div>
  )
}

export function PersonCard({
  id,
  name,
  image,
  role,
  location,
  interests,
  linkedinUrl,
  bio,
  isMentor,
}: PersonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="border border-white/[0.06] rounded-3xl p-1.5 bg-white/[0.02] h-full"
    >
      <div className="bg-bg-card rounded-[calc(1.5rem-0.375rem)] overflow-hidden flex flex-col h-full p-5 gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {image ? (
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border border-border-strong">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <GradientAvatar name={name} />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-text-primary font-semibold text-sm leading-tight truncate">
                {name}
              </h3>
              {isMentor && (
                <Star
                  size={13}
                  strokeWidth={1.5}
                  className="text-yellow-400 flex-shrink-0 fill-yellow-400"
                />
              )}
            </div>
            {role && (
              <p className="text-xs text-text-secondary mt-0.5 truncate">{role}</p>
            )}
            {location && (
              <div className="flex items-center gap-1 text-[11px] text-text-muted mt-1">
                <MapPin size={11} strokeWidth={1.5} />
                {location}
              </div>
            )}
          </div>

          {isMentor && (
            <Badge variant="purple" className="flex-shrink-0 text-[11px]">
              Mentor
            </Badge>
          )}
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-xs text-text-secondary leading-relaxed">
            {truncate(bio, 80)}
          </p>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {interests.slice(0, 3).map((interest, i) => (
              <Badge key={interest} variant={tagVariants[i % tagVariants.length]}>
                {interest}
              </Badge>
            ))}
            {interests.length > 3 && (
              <Badge variant="gray">+{interests.length - 3}</Badge>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* CTA */}
        <div className="pt-3 border-t border-white/[0.06] flex gap-2">
          <Link href={`/people/${id}`} className={linkedinUrl ? "flex-1" : "w-full"}>
            <Button variant="ghost" size="sm" className="w-full gap-1.5">
              <User size={13} strokeWidth={1.5} />
              View Profile
            </Button>
          </Link>
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5 px-3">
                <LinkedInIcon size={13} />
              </Button>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}
