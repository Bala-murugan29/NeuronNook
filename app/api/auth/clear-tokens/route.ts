import { type NextRequest, NextResponse } from "next/server"
import { getSessionToken, verifySession, clearSessionCookie } from "@/lib/auth"
import { findUserByEmail, updateUser } from "@/lib/db"

/**
 * Clear all Google tokens for the current user
 * POST /api/auth/clear-tokens
 */
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

  try {
    // Clear Google tokens from the database
    await updateUser(userRecord.id, {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleConnected: false,
    })

    // Also clear Microsoft tokens if present
    await updateUser(userRecord.id, {
      microsoftAccessToken: null,
      microsoftRefreshToken: null,
      microsoftConnected: false,
    })

    return NextResponse.json({
      message: "All tokens cleared successfully",
      note: "Please log in again to re-authenticate with all scopes",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to clear tokens",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
