import { type NextRequest, NextResponse } from "next/server"
import { getSessionToken, verifySession } from "@/lib/auth"
import { categorizeEmailsWithNvidiaNim } from "@/lib/ai-categorize"

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
    const { emails } = await request.json()

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "Invalid emails data" }, { status: 400 })
    }

    const categorizations = await categorizeEmailsWithNvidiaNim(emails)

    // Convert Map to object for JSON response
    const result: Record<string, { category: string; confidence: number; reasoning: string }> = {}
    categorizations.forEach((value, key) => {
      result[key] = value
    })

    return NextResponse.json({ categorizations: result })
  } catch (error) {
    console.error("NVIDIA NIM categorization error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to categorize emails with NVIDIA NIM"
    
    if (errorMessage.includes("API key")) {
      return NextResponse.json({ 
        error: "NVIDIA NIM API not configured. Please set NVIDIA_API_KEY in .env" 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 })
  }
}
