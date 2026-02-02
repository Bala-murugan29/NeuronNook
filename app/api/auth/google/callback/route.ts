import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, createUser, updateUser, dbRecordToUser } from "@/lib/db"
import { createSession, setSessionCookie, getSessionToken, verifySession } from "@/lib/auth"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

export async function GET(request: NextRequest) {
  try {
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
      } catch {
        // ignore malformed state
      }
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
      const detail = await tokenRes.text()
      console.error("Google token exchange failed", detail)
      return NextResponse.redirect(new URL("/?error=token_exchange_failed", request.url))
    }

    const tokens = await tokenRes.json()

    // Verify what scopes were actually granted
    try {
      const tokenInfoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${tokens.access_token}`,
      )
      if (tokenInfoRes.ok) {
        const tokenInfo = await tokenInfoRes.json()
        console.log("✅ Token granted with scopes:", tokenInfo.scope)
        
        // Check for Photos scopes specifically
        const scopes = tokenInfo.scope ? tokenInfo.scope.split(" ") : []
        const hasPhotos = scopes.some((s: string) => s.includes("photoslibrary"))
        console.log(hasPhotos ? "✅ Google Photos scope GRANTED" : "❌ Google Photos scope MISSING")
      }
    } catch (e) {
      console.error("Failed to verify token scopes:", e)
    }

    // Get user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoRes.ok) {
      const detail = await userInfoRes.text()
      console.error("Google userinfo failed", detail)
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
      // Update existing user (don't pass email to avoid MongoDB conflict)
      userRecord = await updateUser(userRecord.id, {
        googleConnected: true,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        image: googleUser.picture,
      })
    }

    if (!userRecord) {
      throw new Error("User record missing after upsert")
    }

    const user = dbRecordToUser(userRecord)
    const sessionToken = await createSession(user)

    const response = NextResponse.redirect(new URL("/dashboard", request.url))
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Google callback failed", error)
    return NextResponse.redirect(new URL("/?error=google_callback_failed", request.url))
  }
}
