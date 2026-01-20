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
