export interface NormalizedExperience {
  id: string
  type: string
  title: string
  organization: string | null
  startDate: string | null
  endDate: string | null
  current: boolean
  description: string | null
  skills: string[]
  url: string | null
}

export interface NormalizedProfileData {
  id: string
  name: string | null
  email: string | null
  image: string | null
  location: string | null
  onboarded: boolean
  digestEnabled: boolean
  githubUrl: string | null
  portfolioUrl: string | null
  telegramHandle: string | null
  discordHandle: string | null
  interests: string[]
  experiences: NormalizedExperience[]
}

export function normalizeStringArray(input: unknown): string[] {
  return Array.isArray(input)
    ? input.filter((item): item is string => typeof item === "string")
    : []
}

export function normalizeExperience(input: unknown): NormalizedExperience {
  const item = typeof input === "object" && input !== null
    ? input as Record<string, unknown>
    : {}

  return {
    id: typeof item.id === "string" ? item.id : "",
    type: typeof item.type === "string" ? item.type : "WORK",
    title: typeof item.title === "string" ? item.title : "",
    organization: typeof item.organization === "string" ? item.organization : null,
    startDate: typeof item.startDate === "string" ? item.startDate : null,
    endDate: typeof item.endDate === "string" ? item.endDate : null,
    current: Boolean(item.current),
    description: typeof item.description === "string" ? item.description : null,
    skills: normalizeStringArray(item.skills),
    url: typeof item.url === "string" ? item.url : null,
  }
}

export function normalizeProfileData(input: unknown): NormalizedProfileData {
  const data = typeof input === "object" && input !== null
    ? input as Record<string, unknown>
    : {}

  return {
    id: typeof data.id === "string" ? data.id : "",
    name: typeof data.name === "string" ? data.name : null,
    email: typeof data.email === "string" ? data.email : null,
    image: typeof data.image === "string" ? data.image : null,
    location: typeof data.location === "string" ? data.location : null,
    onboarded: Boolean(data.onboarded),
    // Treat NULL/missing as opted-in (default until the user explicitly opts out).
    digestEnabled: data.digestEnabled !== false,
    githubUrl: typeof data.githubUrl === "string" ? data.githubUrl : null,
    portfolioUrl: typeof data.portfolioUrl === "string" ? data.portfolioUrl : null,
    telegramHandle: typeof data.telegramHandle === "string" ? data.telegramHandle : null,
    discordHandle: typeof data.discordHandle === "string" ? data.discordHandle : null,
    interests: normalizeStringArray(data.interests),
    experiences: Array.isArray(data.experiences)
      ? data.experiences.map(normalizeExperience)
      : [],
  }
}
