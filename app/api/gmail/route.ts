import { type NextRequest, NextResponse } from "next/server"
import { getSessionToken, verifySession, refreshGoogleAccessToken } from "@/lib/auth"
import { findUserByEmail, dbRecordToUser, updateUser } from "@/lib/db"

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

  const user = dbRecordToUser(userRecord)

  if (!user.googleConnected || !user.googleAccessToken) {
    return NextResponse.json({ error: "Google not connected" }, { status: 403 })
  }

  let accessToken = user.googleAccessToken

  // Try to refresh token if we have a refresh token
  if (user.googleRefreshToken) {
    try {
      const newToken = await refreshGoogleAccessToken(user.googleRefreshToken)
      if (newToken) {
        accessToken = newToken
        // Update the user's access token in the database
        try {
          await updateUser(user.id, { googleAccessToken: newToken })
        } catch (updateError) {
          console.error("Failed to update token in database:", updateError)
          // Continue with the new token anyway
        }
      }
    } catch (refreshError) {
      console.error("Failed to refresh token:", refreshError)
      // Continue with the old token
    }
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
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!messagesRes.ok) {
      const errorText = await messagesRes.text()
      console.error("Gmail API error:", {
        status: messagesRes.status,
        body: errorText,
      })
      try {
        const error = JSON.parse(errorText)
        return NextResponse.json(
          { error: error.error?.message || "Failed to fetch emails" },
          { status: messagesRes.status },
        )
      } catch {
        return NextResponse.json({ error: errorText || "Failed to fetch emails" }, { status: messagesRes.status })
      }
    }

    const messagesData = await messagesRes.json()
    const messages = messagesData.messages || []

    // Fetch details for each message
    const emailPromises = messages.map(async (msg: { id: string }) => {
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
        headers: { Authorization: `Bearer ${accessToken}` },
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
