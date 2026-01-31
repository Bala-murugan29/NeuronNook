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
  const pageSize = searchParams.get("pageSize") || "50"
  const pageToken = searchParams.get("pageToken") || ""

  try {
    const photosUrl = new URL("https://photoslibrary.googleapis.com/v1/mediaItems")
    photosUrl.searchParams.set("pageSize", pageSize)
    if (pageToken) {
      photosUrl.searchParams.set("pageToken", pageToken)
    }
    if (apiKey) {
      photosUrl.searchParams.set("key", apiKey)
    }

    const photosRes = await fetch(photosUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!photosRes.ok) {
      const errorText = await photosRes.text()
      console.error("Google Photos API error:", {
        status: photosRes.status,
        body: errorText,
      })
      try {
        const error = JSON.parse(errorText)
        return NextResponse.json(
          { error: error.error?.message || "Failed to fetch photos" },
          { status: photosRes.status },
        )
      } catch {
        return NextResponse.json({ error: errorText || "Failed to fetch photos" }, { status: photosRes.status })
      }
    }

    const data = await photosRes.json()

    const photos = (data.mediaItems || []).map(
      (item: {
        id: string
        baseUrl: string
        productUrl: string
        mimeType: string
        filename: string
        mediaMetadata: {
          creationTime: string
          width: string
          height: string
          photo?: {
            cameraMake?: string
            cameraModel?: string
          }
        }
      }) => ({
        id: item.id,
        baseUrl: item.baseUrl,
        productUrl: item.productUrl,
        mimeType: item.mimeType,
        filename: item.filename,
        creationTime: item.mediaMetadata?.creationTime,
        width: Number.parseInt(item.mediaMetadata?.width || "0"),
        height: Number.parseInt(item.mediaMetadata?.height || "0"),
        cameraMake: item.mediaMetadata?.photo?.cameraMake,
        cameraModel: item.mediaMetadata?.photo?.cameraModel,
      }),
    )

    return NextResponse.json({
      photos,
      nextPageToken: data.nextPageToken,
    })
  } catch (error) {
    console.error("Photos API error:", error)
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
  }
}
