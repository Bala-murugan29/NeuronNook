import { type NextRequest, NextResponse } from "next/server"

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!
const MICROSOFT_REDIRECT_URI =
  process.env.MICROSOFT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`

const SCOPES = ["openid", "email", "profile", "offline_access", "User.Read", "Files.Read.All"].join(" ")

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const isLinking = searchParams.get("link") === "true"

  const state = JSON.stringify({ link: isLinking })

  const authUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")
  authUrl.searchParams.set("client_id", MICROSOFT_CLIENT_ID)
  authUrl.searchParams.set("redirect_uri", MICROSOFT_REDIRECT_URI)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", SCOPES)
  authUrl.searchParams.set("response_mode", "query")
  authUrl.searchParams.set("state", Buffer.from(state).toString("base64"))

  return NextResponse.redirect(authUrl.toString())
}
