import { type NextRequest, NextResponse } from "next/server"
import { getSessionToken, verifySession } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 60

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
    const { photos } = await request.json()

    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json({ error: "Invalid photos data" }, { status: 400 })
    }

    // Process photos in batches
    const batchSize = 10
    const results: Record<string, { commonName: string; confidence: number; description: string }> = {}

    for (let i = 0; i < photos.length; i += batchSize) {
      const batch = photos.slice(i, i + batchSize)

      const photoList = batch
        .map(
          (p: { id: string; filename: string; creationTime: string; location?: { locationName?: string } }) =>
            `- ID: ${p.id}\n  Filename: ${p.filename}\n  Date: ${new Date(p.creationTime).toLocaleDateString()}${p.location?.locationName ? `\n  Location: ${p.location.locationName}` : ""}`,
        )
        .join("\n\n")

      const prompt = `Analyze these photos and assign each a common descriptive name/category and description.

Photos:
${photoList}

For each photo, provide:
1. A common name/category (e.g., "Family Vacation", "Birthday Party", "Nature", "Food", "Pets", "Work Event", "Selfie", "Sunset", "Architecture", etc.)
2. A confidence score (0.0 to 1.0)
3. A brief description

Respond ONLY with valid JSON in this exact format:
{
  "photo_id_1": {
    "commonName": "category name",
    "confidence": 0.85,
    "description": "brief description"
  },
  "photo_id_2": {...}
}

Base your categorization on the filename, date, and location context. Be creative and descriptive with common names.`

      const message = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      })

      const content = message.content[0]
      if (content.type === "text") {
        try {
          const jsonMatch = content.text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            Object.assign(results, parsed)
          }
        } catch (e) {
          console.error("Failed to parse batch response:", e)
        }
      }
    }

    return NextResponse.json({ categorizations: results })
  } catch (error) {
    console.error("Photo categorization error:", error)
    return NextResponse.json({ error: "Failed to categorize photos" }, { status: 500 })
  }
}
