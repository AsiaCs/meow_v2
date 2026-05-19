import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const tagsParam = searchParams.get("tags")
    const remoteParam = searchParams.get("remote")
    const paidParam = searchParams.get("paid")

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (tagsParam) {
      const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
      if (tags.length > 0) {
        where.tags = { hasSome: tags }
      }
    }

    if (remoteParam === "true") {
      where.isRemote = true
    }

    if (paidParam === "true") {
      where.isPaid = true
    }

    const internships = await prisma.internship.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        isRemote: true,
        description: true,
        applicationUrl: true,
        deadline: true,
        isPaid: true,
        salary: true,
        tags: true,
        source: true,
        sourceUrl: true,
        createdAt: true,
      },
    })

    return NextResponse.json(internships)
  } catch (error) {
    console.error("[internships/GET]", error)
    return NextResponse.json({ error: "Failed to fetch internships" }, { status: 500 })
  }
}
