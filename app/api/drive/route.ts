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
    console.error("Google not connected for user:", {
      email: user.email,
      googleConnected: user.googleConnected,
      hasToken: !!user.googleAccessToken,
    })
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

  const { searchParams } = new URL(request.url)
  const pageSize = searchParams.get("pageSize") || "50"
  const pageToken = searchParams.get("pageToken") || ""

  try {
    const driveUrl = new URL("https://www.googleapis.com/drive/v3/files")
    driveUrl.searchParams.set("pageSize", pageSize)
    driveUrl.searchParams.set(
      "fields",
      "nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink)",
    )
    driveUrl.searchParams.set("orderBy", "modifiedTime desc")
    if (pageToken) {
      driveUrl.searchParams.set("pageToken", pageToken)
    }

    const driveRes = await fetch(driveUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!driveRes.ok) {
      const errorText = await driveRes.text()
      console.error("Google Drive API error:", {
        status: driveRes.status,
        body: errorText,
      })
      try {
        const error = JSON.parse(errorText)
        return NextResponse.json(
          { error: error.error?.message || "Failed to fetch files" },
          { status: driveRes.status },
        )
      } catch {
        return NextResponse.json({ error: errorText || "Failed to fetch files" }, { status: driveRes.status })
      }
    }

    const data = await driveRes.json()

    const files = (data.files || []).map(
      (file: {
        id: string
        name: string
        mimeType: string
        size?: string
        modifiedTime: string
        webViewLink?: string
        iconLink?: string
        thumbnailLink?: string
      }) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size ? Number.parseInt(file.size) : undefined,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        iconLink: file.iconLink,
        thumbnailLink: file.thumbnailLink,
      }),
    )

    return NextResponse.json({
      files,
      nextPageToken: data.nextPageToken,
    })
  } catch (error) {
    console.error("Drive API error:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}
