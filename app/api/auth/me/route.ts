import { NextResponse } from "next/server"
import { getSessionToken, verifySession } from "@/lib/auth"
import { findUserByEmail, dbRecordToUser } from "@/lib/db"

export async function GET() {
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

  const user = dbRecordToUser(userRecord)

  // Don't expose tokens to client
  const safeUser = {
    ...user,
    googleAccessToken: undefined,
    googleRefreshToken: undefined,
    microsoftAccessToken: undefined,
    microsoftRefreshToken: undefined,
  }

  return NextResponse.json(safeUser)
}
