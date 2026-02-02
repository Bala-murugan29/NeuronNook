import { NextResponse } from "next/server"
import { getSessionToken, verifySession } from "@/lib/auth"
import { findUserByEmail, dbRecordToUser } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const token = await getSessionToken()

    if (!token) {
      console.error("[/api/auth/me] No session token found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const session = await verifySession(token)

    if (!session) {
      console.error("[/api/auth/me] Invalid session token")
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const userRecord = await findUserByEmail(session.email)

    if (!userRecord) {
      console.error("[/api/auth/me] User not found:", session.email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = dbRecordToUser(userRecord)

    // Don't expose tokens to client
    const safeUser = {
      ...user,
      googleAccessToken: undefined,
      googleRefreshToken: undefined,
      microsoftAccessToken: undefined,
      microsoftRefreshToken: undefined,
    }

    return NextResponse.json(safeUser)
  } catch (error) {
    console.error("[/api/auth/me] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
