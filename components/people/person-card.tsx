"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, Star, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

function GradientInitial({ name }: { name: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
      style={{ background: "var(--gradient-brand)" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function PersonCard({
  id,
  name,
  location,
  interests,
  isMentor,
}: PersonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="border border-white/[0.06] rounded-3xl p-1.5 bg-white/[0.02] h-full cursor-pointer"
    >
      <Link href={`/people/${id}`} className="block h-full">
        <div className="bg-bg-card rounded-[calc(1.5rem-0.375rem)] overflow-hidden flex flex-col h-full p-5 gap-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <GradientInitial name={name} />
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
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-medium text-purple-light">
              View Profile
            </span>
            <ArrowRight size={12} strokeWidth={1.5} className="text-text-muted" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
