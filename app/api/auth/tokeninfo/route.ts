import { type NextRequest, NextResponse } from "next/server"
import { getSessionToken, verifySession, refreshGoogleAccessToken } from "@/lib/auth"
import { findUserByEmail, dbRecordToUser, updateUser } from "@/lib/db"

/**
 * Diagnostic endpoint to verify what scopes are actually in the access token
 * GET /api/auth/tokeninfo
 */
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
        }
      }
    } catch (refreshError) {
      console.error("Failed to refresh token:", refreshError)
    }
  }

  try {
    // Call Google's tokeninfo endpoint to verify the token and see what scopes it has
    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`,
    )

    if (!tokenInfoResponse.ok) {
      const error = await tokenInfoResponse.text()
      return NextResponse.json(
        {
          error: "Failed to get token info",
          details: error,
        },
        { status: tokenInfoResponse.status },
      )
    }

    const tokenInfo = await tokenInfoResponse.json()

    // Parse the scope string into an array for easier reading
    const scopes = tokenInfo.scope ? tokenInfo.scope.split(" ") : []

    // Check for required Photos scopes
    const hasPhotosReadonly = scopes.includes("https://www.googleapis.com/auth/photoslibrary.readonly")
    const hasPhotos = scopes.includes("https://www.googleapis.com/auth/photoslibrary")
    const hasGmail = scopes.includes("https://www.googleapis.com/auth/gmail.readonly")
    const hasDrive = scopes.includes("https://www.googleapis.com/auth/drive.readonly")

    return NextResponse.json({
      tokenInfo,
      analysis: {
        totalScopes: scopes.length,
        scopes,
        hasRequiredScopes: {
          "photoslibrary.readonly": hasPhotosReadonly,
          photoslibrary: hasPhotos,
          "gmail.readonly": hasGmail,
          "drive.readonly": hasDrive,
        },
        verdict:
          hasPhotosReadonly || hasPhotos
            ? "✅ Token has Google Photos scope"
            : "❌ Token is MISSING Google Photos scope - need to re-authenticate",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error checking token",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
