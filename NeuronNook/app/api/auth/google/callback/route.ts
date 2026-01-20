import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, createUser, updateUser, airtableRecordToUser } from "@/lib/airtable"
import { createSession, setSessionCookie, getSessionToken, verifySession } from "@/lib/auth"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const stateBase64 = searchParams.get("state")

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  let isLinking = false
  if (stateBase64) {
    try {
      const state = JSON.parse(Buffer.from(stateBase64, "base64").toString())
      isLinking = state.link === true
    } catch {}
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", request.url))
  }

  const tokens = await tokenRes.json()

  // Get user info
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userInfoRes.ok) {
    return NextResponse.redirect(new URL("/?error=user_info_failed", request.url))
  }

  const googleUser = await userInfoRes.json()

  if (isLinking) {
    // Link account to existing user
    const sessionToken = await getSessionToken()
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/?error=not_authenticated", request.url))
    }

    const session = await verifySession(sessionToken)
    if (!session) {
      return NextResponse.redirect(new URL("/?error=invalid_session", request.url))
    }

    // Update existing user with Google credentials
    const existingUser = await findUserByEmail(session.email)
    if (existingUser) {
      await updateUser(existingUser.id, {
        googleConnected: true,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
      })
    }

    return NextResponse.redirect(new URL("/dashboard?linked=google", request.url))
  }

  // Normal login/signup flow
  let userRecord = await findUserByEmail(googleUser.email)

  if (!userRecord) {
    // Create new user
    userRecord = await createUser({
      email: googleUser.email,
      name: googleUser.name,
      image: googleUser.picture,
      googleConnected: true,
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
    })
  } else {
    // Update existing user
    await updateUser(userRecord.id, {
      googleConnected: true,
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      image: googleUser.picture,
    })
    userRecord = await findUserByEmail(googleUser.email)
  }

  const user = airtableRecordToUser(userRecord!)
  const sessionToken = await createSession(user)

  const response = NextResponse.redirect(new URL("/dashboard", request.url))
  await setSessionCookie(sessionToken, response)

  return response
}
