import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const tagsParam = searchParams.get("tags")
    const virtualParam = searchParams.get("virtual")
    const freeParam = searchParams.get("free")
    const dateParam = searchParams.get("date")

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { status: "APPROVED" }

    if (tagsParam) {
      const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
      if (tags.length > 0) {
        where.tags = { hasSome: tags }
      }
    }

    if (virtualParam === "true") {
      where.isVirtual = true
    }

    if (freeParam === "true") {
      where.isFree = true
    }

    if (dateParam) {
      const date = new Date(dateParam)
      if (!isNaN(date.getTime())) {
        const dayStart = new Date(date)
        dayStart.setUTCHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setUTCHours(23, 59, 59, 999)
        where.startDate = { gte: dayStart, lte: dayEnd }
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        isVirtual: true,
        virtualLink: true,
        registrationUrl: true,
        imageUrl: true,
        tags: true,
        source: true,
        isFree: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("[events/GET]", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
