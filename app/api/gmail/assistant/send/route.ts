import { NextRequest, NextResponse } from "next/server"
import { getSessionToken, verifySession, refreshGoogleAccessToken } from "@/lib/auth"
import { dbRecordToUser, findUserByEmail, updateUser } from "@/lib/db"

function base64UrlEncode(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
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

  if (!user.googleConnected || !user.googleAccessToken) {
    return NextResponse.json({ error: "Google not connected" }, { status: 403 })
  }

  let payload: { to?: string; subject?: string; body?: string } = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const to = (payload.to || "").trim()
  const subject = (payload.subject || "").trim()
  const body = (payload.body || "").trim()

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Recipient, subject, and body are required" }, { status: 400 })
  }

  let accessToken = user.googleAccessToken

  if (user.googleRefreshToken) {
    try {
      const newToken = await refreshGoogleAccessToken(user.googleRefreshToken)
      if (newToken) {
        accessToken = newToken
        try {
          await updateUser(user.id, { googleAccessToken: newToken })
        } catch (updateError) {
          console.error("Failed to update token in database:", updateError)
        }
      }
    } catch (refreshError) {
      console.error("Failed to refresh token:", refreshError)
    }
  }

  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=\"UTF-8\"",
    "",
    body,
  ].join("\r\n")

  const apiKey = process.env.GMAIL_API_KEY
  const sendUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages/send")
  if (apiKey) {
    sendUrl.searchParams.set("key", apiKey)
  }

  try {
    const res = await fetch(sendUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64UrlEncode(rawMessage) }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Gmail send error:", { status: res.status, body: errorText })
      return NextResponse.json({ error: "Failed to send email" }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({ id: data.id, threadId: data.threadId })
  } catch (error) {
    console.error("Gmail send error:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
