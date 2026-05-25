"use client"

import { useState, useEffect } from "react"
import {
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Users,
  Plus,
  X,
  Save,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { INTEREST_AREAS, cn, formatDate } from "@/lib/utils"
import { normalizeExperience, normalizeProfileData } from "@/lib/profile-normalization"

type ExperienceType =
  | "WORK"
  | "EDUCATION"
  | "PROJECT"
  | "CERTIFICATION"
  | "EXTRACURRICULAR"

interface Experience {
  id: string
  type: ExperienceType
  title: string
  organization?: string | null
  startDate?: string | null
  endDate?: string | null
  current: boolean
  description?: string | null
  skills: string[]
  url?: string | null
}

interface ProfileData {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  location?: string | null
  interests: string[]
  experiences: Experience[]
}

const EXPERIENCE_TABS: {
  label: string
  value: ExperienceType
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}[] = [
  { label: "Work", value: "WORK", icon: Briefcase },
  { label: "Education", value: "EDUCATION", icon: GraduationCap },
  { label: "Projects", value: "PROJECT", icon: Code },
  { label: "Certifications", value: "CERTIFICATION", icon: Award },
  { label: "Extracurriculars", value: "EXTRACURRICULAR", icon: Users },
]

const TYPE_LABELS: Record<ExperienceType, string> = {
  WORK: "Work Experience",
  EDUCATION: "Education",
  PROJECT: "Project",
  CERTIFICATION: "Certification",
  EXTRACURRICULAR: "Extracurricular",
}

interface ExperienceFormData {
  type: ExperienceType
  title: string
  organization: string
  startDate: string
  endDate: string
  current: boolean
  description: string
  skills: string
  url: string
}

function ExperienceItemCard({
  item,
  onDelete,
}: {
  item: Experience
  onDelete: (id: string) => void
}) {
  return (
    <div className="border border-white/[0.06] rounded-2xl p-4 bg-bg-elevated/50 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary">{item.title}</h4>
          {item.organization && (
            <p className="text-xs text-text-secondary mt-0.5">{item.organization}</p>
          )}
          {(item.startDate || item.endDate || item.current) && (
            <p className="text-[11px] text-text-muted mt-1">
              {item.startDate ? formatDate(item.startDate) : ""}
              {item.endDate || item.current
                ? " — " + (item.current ? "Present" : formatDate(item.endDate!))
                : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="text-text-muted hover:text-red-400 transition-colors p-1"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
      {item.description && (
        <p className="text-xs text-text-muted leading-relaxed">{item.description}</p>
      )}
      {item.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.skills.map((s) => (
            <Badge key={s} variant="gray">
              {s}
            </Badge>
          ))}
        </div>
      )}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-purple hover:text-purple-light transition-colors"
        >
          <ExternalLink size={11} strokeWidth={1.5} />
          View link
        </a>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [activeTab, setActiveTab] = useState<ExperienceType>("WORK")
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingExp, setAddingExp] = useState(false)

  const [editLocation, setEditLocation] = useState("")
  const [editInterests, setEditInterests] = useState<string[]>([])

  const [expForm, setExpForm] = useState<ExperienceFormData>({
    type: "WORK",
    title: "",
    organization: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    skills: "",
    url: "",
  })

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (!data || data.error) {
          setLoading(false)
          return
        }
        // Defensive normalization — the API can return a user with no
        // experiences/interests rows. Treat missing as empty so .filter and
        // .map calls never crash.
        const normalized = normalizeProfileData(data) as ProfileData
        setProfile(normalized)
        setEditLocation(normalized.location ?? "")
        setEditInterests(normalized.interests)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function saveProfile() {
    setSaving(true)
    setSaveMessage("")
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: editLocation,
          interests: editInterests,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile((prev) => (prev ? normalizeProfileData({ ...prev, ...updated }) as ProfileData : prev))
        setSaveMessage("Saved successfully")
        setTimeout(() => setSaveMessage(""), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  function toggleInterest(area: string) {
    setEditInterests((prev) =>
      prev.includes(area) ? prev.filter((i) => i !== area) : [...prev, area]
    )
  }

  async function addExperience() {
    setAddingExp(true)
    try {
      // Convert "YYYY-MM" month inputs to ISO datetime strings the API expects
      function monthToIso(val: string): string | undefined {
        if (!val) return undefined
        // "YYYY-MM" -> "YYYY-MM-01T00:00:00.000Z"
        return new Date(`${val}-01T00:00:00.000Z`).toISOString()
      }

      const body = {
        type: activeTab,
        title: expForm.title,
        organization: expForm.organization || undefined,
        startDate: monthToIso(expForm.startDate),
        endDate: expForm.current ? undefined : monthToIso(expForm.endDate),
        current: expForm.current,
        description: expForm.description || undefined,
        skills: expForm.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        url: expForm.url || undefined,
      }
      const res = await fetch("/api/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const newExp = await res.json()
        const normalizedExp = normalizeExperience(newExp) as Experience
        setProfile((prev) =>
          prev
            ? { ...prev, experiences: [...(prev.experiences ?? []), normalizedExp] }
            : prev
        )
        setShowAddForm(false)
        setExpForm({
          type: activeTab,
          title: "",
          organization: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
          skills: "",
          url: "",
        })
      }
    } finally {
      setAddingExp(false)
    }
  }

  async function deleteExperience(id: string) {
    const res = await fetch(`/api/experience/${id}`, { method: "DELETE" })
    if (res.ok) {
      setProfile((prev) =>
        prev
          ? { ...prev, experiences: (prev.experiences ?? []).filter((e) => e.id !== id) }
          : prev
      )
    }
  }

  const filteredExp = profile?.experiences?.filter((e) => e.type === activeTab) ?? []

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const initial = profile.name?.charAt(0).toUpperCase() ?? "U"

  return (
    <div className="min-h-dvh px-6 py-8 max-w-3xl mx-auto space-y-8">
      {/* Profile header */}
      <Card>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-border-strong bg-bg-elevated">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image}
                  alt={profile.name ?? "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  {initial}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-text-primary font-display">
                {profile.name ?? "Your Name"}
              </h1>
              <p className="text-sm text-text-muted">{profile.email}</p>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Location"
              placeholder="City, Region"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <Button onClick={saveProfile} loading={saving} size="md">
              <Save size={15} strokeWidth={1.5} />
              Save Profile
            </Button>
            {saveMessage && (
              <span className="text-sm text-green-400">{saveMessage}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-text-primary">Interests</h2>
          <p className="text-xs text-text-muted mt-1">
            Select your areas of interest to get personalized recommendations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {INTEREST_AREAS.map((area) => {
              const active = editInterests.includes(area)
              return (
                <button
                  key={area}
                  onClick={() => toggleInterest(area)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
                    active
                      ? "border-purple bg-purple/15 text-purple-light"
                      : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary"
                  )}
                >
                  {area}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-text-primary">Experience</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Tab bar */}
          <div className="flex gap-1 flex-wrap">
            {EXPERIENCE_TABS.map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setActiveTab(value)
                  setShowAddForm(false)
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                  activeTab === value
                    ? "text-white"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                )}
                style={
                  activeTab === value
                    ? { background: "var(--gradient-brand)" }
                    : undefined
                }
              >
                <Icon size={14} strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>

          {/* Experience items */}
          {filteredExp.length === 0 && !showAddForm ? (
            <div className="text-center py-8 border border-dashed border-border rounded-2xl">
              <p className="text-text-muted text-sm">
                No {TYPE_LABELS[activeTab].toLowerCase()} added yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExp.map((item) => (
                <ExperienceItemCard
                  key={item.id}
                  item={item}
                  onDelete={deleteExperience}
                />
              ))}
            </div>
          )}

          {/* Add form */}
          {showAddForm && (
            <div className="border border-border rounded-2xl p-4 bg-bg-surface space-y-4">
              <h4 className="text-sm font-semibold text-text-primary">
                Add {TYPE_LABELS[activeTab]}
              </h4>
              <Input
                label="Title / Role"
                placeholder={
                  activeTab === "WORK"
                    ? "Software Engineering Intern"
                    : activeTab === "EDUCATION"
                    ? "B.S. Computer Science"
                    : "Title"
                }
                value={expForm.title}
                onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
              />
              <Input
                label="Organization"
                placeholder={
                  activeTab === "WORK"
                    ? "Company name"
                    : activeTab === "EDUCATION"
                    ? "University name"
                    : "Organization"
                }
                value={expForm.organization}
                onChange={(e) =>
                  setExpForm({ ...expForm, organization: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Date"
                  type="month"
                  value={expForm.startDate}
                  onChange={(e) =>
                    setExpForm({ ...expForm, startDate: e.target.value })
                  }
                />
                {!expForm.current && (
                  <Input
                    label="End Date"
                    type="month"
                    value={expForm.endDate}
                    onChange={(e) =>
                      setExpForm({ ...expForm, endDate: e.target.value })
                    }
                  />
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expForm.current}
                  onChange={(e) =>
                    setExpForm({ ...expForm, current: e.target.checked })
                  }
                  className="accent-purple"
                />
                <span className="text-sm text-text-secondary">Currently here</span>
              </label>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description..."
                  value={expForm.description}
                  onChange={(e) =>
                    setExpForm({ ...expForm, description: e.target.value })
                  }
                  className="bg-bg-base border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 transition-all resize-none"
                />
              </div>
              <Input
                label="Skills (comma-separated)"
                placeholder="React, TypeScript, Node.js"
                value={expForm.skills}
                onChange={(e) => setExpForm({ ...expForm, skills: e.target.value })}
              />
              <Input
                label="URL (optional)"
                placeholder="https://..."
                value={expForm.url}
                onChange={(e) => setExpForm({ ...expForm, url: e.target.value })}
              />
              <div className="flex gap-2">
                <Button
                  onClick={addExperience}
                  loading={addingExp}
                  disabled={!expForm.title}
                >
                  Add
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Add button */}
          {!showAddForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="w-full gap-1.5"
            >
              <Plus size={15} strokeWidth={1.5} />
              Add {TYPE_LABELS[activeTab]}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
