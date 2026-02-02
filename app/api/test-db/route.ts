import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("[Test DB] Testing MongoDB connection...")
    console.log("[Test DB] MONGODB_URI set:", !!process.env.MONGODB_URI)
    console.log("[Test DB] URI prefix:", process.env.MONGODB_URI?.substring(0, 20))
    
    const startTime = Date.now()
    const db = await getDb()
    const duration = Date.now() - startTime
    
    console.log(`[Test DB] Connection successful in ${duration}ms`)
    
    // Try to list collections
    const collections = await db.listCollections().toArray()
    console.log("[Test DB] Collections:", collections.map(c => c.name))
    
    // Try a simple operation
    const usersCol = db.collection("users")
    const count = await usersCol.countDocuments()
    console.log("[Test DB] Users count:", count)
    
    return NextResponse.json({
      success: true,
      connectionTime: `${duration}ms`,
      database: db.databaseName,
      collections: collections.map(c => c.name),
      usersCount: count,
    })
  } catch (error: any) {
    console.error("[Test DB] Connection failed:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
