import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const interestsParam = searchParams.get("interests")
    const mentorParam = searchParams.get("mentor")
    const searchParam = searchParams.get("search")

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { onboarded: true }

    if (interestsParam) {
      const interests = interestsParam.split(",").map((i) => i.trim()).filter(Boolean)
      if (interests.length > 0) {
        where.interests = { hasSome: interests }
      }
    }

    if (mentorParam === "true") {
      // Mentors are users who have at least one WORK experience entry
      where.experiences = {
        some: { type: "WORK" },
      }
    }

    if (searchParam && searchParam.trim()) {
      where.name = { contains: searchParam.trim(), mode: "insensitive" }
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        image: true,
        location: true,
        interests: true,
        experiences: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    })

    // Shape experience into a summary count by type
    const shaped = users.map((user) => {
      const experienceSummary = user.experiences.reduce(
        (acc, exp) => {
          acc[exp.type] = (acc[exp.type] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      return {
        id: user.id,
        name: user.name,
        image: user.image,
        location: user.location,
        interests: user.interests,
        experienceSummary,
        experienceCount: user.experiences.length,
      }
    })

    return NextResponse.json(shaped)
  } catch (error) {
    console.error("[people/GET]", error)
    return NextResponse.json({ error: "Failed to fetch people" }, { status: 500 })
  }
}
