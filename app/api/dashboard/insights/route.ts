import { type NextRequest, NextResponse } from "next/server"
import { getSessionToken, verifySession } from "@/lib/auth"
import { generateDashboardInsights } from "@/lib/ai-categorize"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const token = await getSessionToken()
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const session = await verifySession(token)
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }

  try {
    const { type, items } = await request.json()

    if (!type || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    if (!["email", "file"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be 'email' or 'file'" }, { status: 400 })
    }

    const insights = await generateDashboardInsights({
      type: type as "email" | "file",
      items,
    })

    return NextResponse.json(insights)
  } catch (error) {
    console.error("Dashboard insights error:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
