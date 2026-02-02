import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, createUser, updateUser, dbRecordToUser } from "@/lib/db"
import { createSession, setSessionCookie, getSessionToken, verifySession } from "@/lib/auth"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

export async function GET(request: NextRequest) {
  try {
    console.log("[Google Callback] Starting OAuth callback...")
    
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const stateBase64 = searchParams.get("state")

    if (!code) {
      console.error("[Google Callback] No authorization code received")
      return NextResponse.redirect(new URL("/?error=no_code", request.url))
    }

    console.log("[Google Callback] Authorization code received, exchanging for tokens...")

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
    console.log("[Google Callback] Token exchange successful, access_token length:", tokens.access_token?.length)

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
    console.log("[Google Callback] Fetching user info from Google...")
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoRes.ok) {
      const detail = await userInfoRes.text()
      console.error("Google userinfo failed", detail)
      return NextResponse.redirect(new URL("/?error=user_info_failed", request.url))
    }

    const googleUser = await userInfoRes.json()
    console.log("[Google Callback] User info received:", { email: googleUser.email, name: googleUser.name })

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
    console.log("[Google Callback] Normal login flow, checking if user exists...")
    let userRecord = await findUserByEmail(googleUser.email)
    console.log("[Google Callback] User lookup result:", userRecord ? "User found" : "User not found")

    if (!userRecord) {
      // Create new user
      console.log("[Google Callback] Creating new user in database...")
      try {
        userRecord = await createUser({
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.picture,
          googleConnected: true,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
        })
        console.log("[Google Callback] User created successfully, id:", userRecord.id)
      } catch (createError) {
        console.error("[Google Callback] Failed to create user:", createError)
        throw createError
      }
    } else {
      // Update existing user (don't pass email to avoid MongoDB conflict)
      console.log("[Google Callback] Updating existing user...")
      try {
        userRecord = await updateUser(userRecord.id, {
          googleConnected: true,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
          image: googleUser.picture,
        })
        console.log("[Google Callback] User updated successfully")
      } catch (updateError) {
        console.error("[Google Callback] Failed to update user:", updateError)
        throw updateError
      }
    }

    if (!userRecord) {
      console.error("[Google Callback] User record is null after upsert")
      throw new Error("User record missing after upsert")
    }

    console.log("[Google Callback] Converting user record to user object...")
    const user = dbRecordToUser(userRecord)
    console.log("[Google Callback] Creating session token...")
    const sessionToken = await createSession(user)
    console.log("[Google Callback] Session token created, length:", sessionToken.length)

    console.log("[Google Callback] Session token created, setting cookie...")

    const response = NextResponse.redirect(new URL("/dashboard", request.url))
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    console.log("[Google Callback] Cookie set, redirecting to dashboard")

    return response
  } catch (error) {
    console.error("Google callback failed", error)
    return NextResponse.redirect(new URL("/?error=google_callback_failed", request.url))
  }
}
