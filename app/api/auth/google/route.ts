import { type NextRequest, NextResponse } from "next/server"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/photoslibrary.readonly",
  "https://www.googleapis.com/auth/photoslibrary",
].join(" ")

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const isLinking = searchParams.get("link") === "true"

  const state = JSON.stringify({ link: isLinking })

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID)
  authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", SCOPES)
  authUrl.searchParams.set("access_type", "offline")
  authUrl.searchParams.set("prompt", "consent")
  authUrl.searchParams.set("state", Buffer.from(state).toString("base64"))
  authUrl.searchParams.set("include_granted_scopes", "true") // Enable incremental authorization

  // Log the OAuth URL for debugging (scopes verification)
  console.log("🔐 Google OAuth URL:", authUrl.toString())
  console.log("📋 Requested Scopes:", SCOPES)

  return NextResponse.redirect(authUrl.toString())
}
