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

  if (!user.microsoftConnected || !user.microsoftAccessToken) {
    return NextResponse.json({ error: "Microsoft not connected" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const top = searchParams.get("top") || "50"
  const skipToken = searchParams.get("skipToken") || ""

  try {
    let driveUrl = `https://graph.microsoft.com/v1.0/me/drive/root/children?$top=${top}&$select=id,name,size,lastModifiedDateTime,webUrl,file`

    if (skipToken) {
      driveUrl += `&$skiptoken=${skipToken}`
    }

    const driveRes = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${user.microsoftAccessToken}` },
    })

    if (!driveRes.ok) {
      const error = await driveRes.json()
      return NextResponse.json({ error: error.error?.message || "Failed to fetch files" }, { status: driveRes.status })
    }

    const data = await driveRes.json()

    const files = (data.value || []).map(
      (item: {
        id: string
        name: string
        size: number
        lastModifiedDateTime: string
        webUrl?: string
        file?: { mimeType: string }
      }) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        lastModifiedDateTime: item.lastModifiedDateTime,
        webUrl: item.webUrl,
        mimeType: item.file?.mimeType || "folder",
      }),
    )

    // Extract skip token from @odata.nextLink
    let nextSkipToken = ""
    if (data["@odata.nextLink"]) {
      const nextUrl = new URL(data["@odata.nextLink"])
      nextSkipToken = nextUrl.searchParams.get("$skiptoken") || ""
    }

    return NextResponse.json({
      files,
      nextSkipToken,
    })
  } catch (error) {
    console.error("OneDrive API error:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}
