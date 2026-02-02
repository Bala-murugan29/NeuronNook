import { NextRequest, NextResponse } from "next/server"
import { getSessionToken, verifySession, refreshGoogleAccessToken } from "@/lib/auth"
import { dbRecordToUser, findUserByEmail, updateUser } from "@/lib/db"

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

  let payload: { emailId?: string } = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const emailId = (payload.emailId || "").trim()
  if (!emailId) {
    return NextResponse.json({ error: "Email ID is required" }, { status: 400 })
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

  const apiKey = process.env.GMAIL_API_KEY
  const deleteUrl = new URL(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}`
  )
  if (apiKey) {
    deleteUrl.searchParams.set("key", apiKey)
  }

  try {
    const res = await fetch(deleteUrl.toString(), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Gmail delete error:", { status: res.status, body: errorText })
      return NextResponse.json({ error: "Failed to delete email" }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Gmail delete error:", error)
    return NextResponse.json({ error: "Failed to delete email" }, { status: 500 })
  }
}
