import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, createUser, updateUser, airtableRecordToUser } from "@/lib/airtable"
import { createSession, setSessionCookie, getSessionToken, verifySession } from "@/lib/auth"

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!
const MICROSOFT_REDIRECT_URI =
  process.env.MICROSOFT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`

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
  const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      redirect_uri: MICROSOFT_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", request.url))
  }

  const tokens = await tokenRes.json()

  // Get user info
  const userInfoRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userInfoRes.ok) {
    return NextResponse.redirect(new URL("/?error=user_info_failed", request.url))
  }

  const microsoftUser = await userInfoRes.json()
  const email = microsoftUser.mail || microsoftUser.userPrincipalName

  if (isLinking) {
    const sessionToken = await getSessionToken()
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/?error=not_authenticated", request.url))
    }

    const session = await verifySession(sessionToken)
    if (!session) {
      return NextResponse.redirect(new URL("/?error=invalid_session", request.url))
    }

    const existingUser = await findUserByEmail(session.email)
    if (existingUser) {
      await updateUser(existingUser.id, {
        microsoftConnected: true,
        microsoftAccessToken: tokens.access_token,
        microsoftRefreshToken: tokens.refresh_token,
      })
    }

    return NextResponse.redirect(new URL("/dashboard?linked=microsoft", request.url))
  }

  let userRecord = await findUserByEmail(email)

  if (!userRecord) {
    userRecord = await createUser({
      email,
      name: microsoftUser.displayName,
      microsoftConnected: true,
      microsoftAccessToken: tokens.access_token,
      microsoftRefreshToken: tokens.refresh_token,
    })
  } else {
    await updateUser(userRecord.id, {
      microsoftConnected: true,
      microsoftAccessToken: tokens.access_token,
      microsoftRefreshToken: tokens.refresh_token,
    })
    userRecord = await findUserByEmail(email)
  }

  const user = airtableRecordToUser(userRecord!)
  const sessionToken = await createSession(user)

  const response = NextResponse.redirect(new URL("/dashboard", request.url))
  await setSessionCookie(sessionToken, response)

  return response
}
