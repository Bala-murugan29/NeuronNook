import { Db, MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "neuron-nook"

if (!uri) {
  throw new Error("MONGODB_URI is not set in environment variables")
}

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function getDb(): Promise<Db> {
  console.log("[MongoDB] getDb called")
  if (cachedDb && cachedClient) {
    console.log("[MongoDB] Using cached connection")
    return cachedDb
  }

  console.log("[MongoDB] Creating new connection to:", dbName)
  try {
    const client = new MongoClient(uri)
    console.log("[MongoDB] Connecting to MongoDB Atlas...")
    await client.connect()
    console.log("[MongoDB] Connected successfully!")

    const db = client.db(dbName)
    cachedClient = client
    cachedDb = db

    return db
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error)
    throw error
  }
}
