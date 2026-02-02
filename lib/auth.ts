import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { SignJWT, jwtVerify } from "jose"
import type { User } from "./types"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function createSession(user: User): Promise<string> {
  const token = await new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET)

  return token
}

export async function verifySession(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("session")?.value || null
}

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
  domain: process.env.NODE_ENV === "production" ? ".vercel.app" : undefined,
}

export async function setSessionCookie(token: string, response?: NextResponse) {
  if (response) {
    response.cookies.set("session", token, sessionCookieOptions)
    return response
  }

  const cookieStore = await cookies()
  cookieStore.set("session", token, sessionCookieOptions)
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  if (!refreshToken) return null

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      console.error("Failed to refresh Google token:", await response.text())
      return null
    }

    const data = await response.json()
    return data.access_token as string
  } catch (error) {
    console.error("Error refreshing Google token:", error)
    return null
  }
}

export async function refreshMicrosoftAccessToken(refreshToken: string): Promise<string | null> {
  if (!refreshToken) return null

  try {
    const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID || "",
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "offline_access mail.readonly calendar.readonly files.read",
      }),
    })

    if (!response.ok) {
      console.error("Failed to refresh Microsoft token:", await response.text())
      return null
    }

    const data = await response.json()
    return data.access_token as string
  } catch (error) {
    console.error("Error refreshing Microsoft token:", error)
    return null
  }
}
