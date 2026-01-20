import { type NextRequest, NextResponse } from "next/server"
import { getSessionToken, verifySession } from "@/lib/auth"
import { findUserByEmail, airtableRecordToUser } from "@/lib/airtable"

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

  const user = airtableRecordToUser(userRecord)

  if (!user.googleConnected || !user.googleAccessToken) {
    return NextResponse.json({ error: "Google not connected" }, { status: 403 })
  }

  const apiKey = process.env.GMAIL_API_KEY

  try {
    const body = await request.json()
    const { startDate, endDate, pageSize = 50, pageToken } = body

    // Build filters for Google Photos API
    interface DateFilter {
      ranges?: Array<{
        startDate: { year: number; month: number; day: number }
        endDate: { year: number; month: number; day: number }
      }>
    }

    interface SearchFilters {
      dateFilter?: DateFilter
    }

    const filters: SearchFilters = {}

    if (startDate || endDate) {
      const dateFilter: DateFilter = {}

      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        dateFilter.ranges = [
          {
            startDate: {
              year: start.getFullYear(),
              month: start.getMonth() + 1,
              day: start.getDate(),
            },
            endDate: {
              year: end.getFullYear(),
              month: end.getMonth() + 1,
              day: end.getDate(),
            },
          },
        ]
      }

      filters.dateFilter = dateFilter
    }

    const searchBody: {
      pageSize: number
      filters?: SearchFilters
      pageToken?: string
    } = {
      pageSize,
    }

    if (Object.keys(filters).length > 0) {
      searchBody.filters = filters
    }

    if (pageToken) {
      searchBody.pageToken = pageToken
    }

    const searchUrl = new URL("https://photoslibrary.googleapis.com/v1/mediaItems:search")
    if (apiKey) {
      searchUrl.searchParams.set("key", apiKey)
    }

    const photosRes = await fetch(searchUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.googleAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchBody),
    })

    if (!photosRes.ok) {
      const error = await photosRes.json()
      return NextResponse.json(
        { error: error.error?.message || "Failed to search photos" },
        { status: photosRes.status },
      )
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
    console.error("Photos search error:", error)
    return NextResponse.json({ error: "Failed to search photos" }, { status: 500 })
  }
}
