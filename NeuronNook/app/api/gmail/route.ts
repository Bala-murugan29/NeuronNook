import { type NextRequest, NextResponse } from "next/server"
import { getSessionToken, verifySession } from "@/lib/auth"
import { findUserByEmail, airtableRecordToUser } from "@/lib/airtable"

export async function GET(request: NextRequest) {
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

  const user = airtableRecordToUser(userRecord)

  if (!user.googleConnected || !user.googleAccessToken) {
    return NextResponse.json({ error: "Google not connected" }, { status: 403 })
  }

  const apiKey = process.env.GMAIL_API_KEY

  const { searchParams } = new URL(request.url)
  const maxResults = searchParams.get("maxResults") || "50"
  const pageToken = searchParams.get("pageToken") || ""

  try {
    // Fetch emails from Gmail API
    const messagesUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages")
    messagesUrl.searchParams.set("maxResults", maxResults)
    if (pageToken) {
      messagesUrl.searchParams.set("pageToken", pageToken)
    }
    if (apiKey) {
      messagesUrl.searchParams.set("key", apiKey)
    }

    const messagesRes = await fetch(messagesUrl.toString(), {
      headers: { Authorization: `Bearer ${user.googleAccessToken}` },
    })

    if (!messagesRes.ok) {
      const error = await messagesRes.json()
      return NextResponse.json(
        { error: error.error?.message || "Failed to fetch emails" },
        { status: messagesRes.status },
      )
    }

    const messagesData = await messagesRes.json()
    const messages = messagesData.messages || []

    // Fetch details for each message
    const emailPromises = messages.slice(0, 20).map(async (msg: { id: string }) => {
      const detailUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`)
      detailUrl.searchParams.set("format", "metadata")
      detailUrl.searchParams.append("metadataHeaders", "From")
      detailUrl.searchParams.append("metadataHeaders", "To")
      detailUrl.searchParams.append("metadataHeaders", "Subject")
      detailUrl.searchParams.append("metadataHeaders", "Date")
      if (apiKey) {
        detailUrl.searchParams.set("key", apiKey)
      }

      const detailRes = await fetch(detailUrl.toString(), {
        headers: { Authorization: `Bearer ${user.googleAccessToken}` },
      })

      if (!detailRes.ok) return null

      const detail = await detailRes.json()
      const headers = detail.payload?.headers || []

      const getHeader = (name: string) =>
        headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || ""

      return {
        id: detail.id,
        threadId: detail.threadId,
        from: getHeader("From"),
        to: getHeader("To"),
        subject: getHeader("Subject"),
        snippet: detail.snippet,
        date: getHeader("Date"),
        isRead: !detail.labelIds?.includes("UNREAD"),
        labels: detail.labelIds || [],
      }
    })

    const emails = (await Promise.all(emailPromises)).filter(Boolean)

    return NextResponse.json({
      emails,
      nextPageToken: messagesData.nextPageToken,
      resultSizeEstimate: messagesData.resultSizeEstimate,
    })
  } catch (error) {
    console.error("Gmail API error:", error)
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
  }
}
