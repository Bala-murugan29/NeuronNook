import { NextRequest, NextResponse } from "next/server"
import { callNvidiaNim } from "@/lib/ai-categorize"
import { getSessionToken, verifySession } from "@/lib/auth"
import { dbRecordToUser, findUserByEmail } from "@/lib/db"

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const token = await getSessionToken()
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const session = await verifySession(token)
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }

  const userRecord = await findUserByEmail(session.email)
  if (!userRecord) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const user = dbRecordToUser(userRecord)

  // Will rely on callNvidiaNim checking NVIDIA_API_KEY

  let payload: { to?: string; prompt?: string } = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const to = (payload.to || "").trim()
  const prompt = (payload.prompt || "").trim()

  if (!to || !prompt) {
    return NextResponse.json({ error: "Recipient and content are required" }, { status: 400 })
  }

  try {
    const aiPrompt = `You are an email assistant. Draft a concise, professional email on behalf of ${user.name} (${user.email}).
Recipient: ${to}
User intent: ${prompt}

Return ONLY valid JSON with this shape:
{
  "subject": "Subject line",
  "body": "Email body in plain text"
}

Guidelines:
- Do not include placeholders.
- Keep the tone friendly and clear.
- End with the sender name: ${user.name}`

    let responseText: string
    try {
      responseText = await callNvidiaNim(aiPrompt)
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "NVIDIA NIM API key not configured" }, { status: 500 })
    }
    const parsed = extractJson(responseText)

    if (!parsed?.subject || !parsed?.body) {
      return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 })
    }

    return NextResponse.json({ subject: parsed.subject, body: parsed.body })
  } catch (error) {
    console.error("AI draft generation error:", error)
    return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 })
  }
}
