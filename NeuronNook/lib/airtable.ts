import { ObjectId } from "mongodb"

import { getDb } from "./mongodb"

interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
  createdTime: string
}

type DbUser = {
  _id?: ObjectId
  email: string
  name: string
  image?: string
  googleConnected?: boolean
  microsoftConnected?: boolean
  googleAccessToken?: string
  googleRefreshToken?: string
  microsoftAccessToken?: string
  microsoftRefreshToken?: string
  createdAt?: string
  updatedAt?: string
}

type DbCategorization = {
  _id?: ObjectId
  userId: string
  itemId: string
  itemType: "email" | "drive" | "photo" | "onedrive"
  category: string
  confidence: number
  reasoning?: string
  createdAt?: string
}

function docToRecord<T extends { _id?: ObjectId; createdAt?: string }>(doc: T): AirtableRecord {
  const { _id, ...fields } = doc
  const createdTime = doc.createdAt || new Date().toISOString()

  return {
    id: (_id || "").toString(),
    fields,
    createdTime,
  }
}

async function usersCollection() {
  const db = await getDb()
  return db.collection<DbUser>("users")
}

async function categorizationsCollection() {
  const db = await getDb()
  return db.collection<DbCategorization>("categorizations")
}

export async function findUserByEmail(email: string): Promise<AirtableRecord | null> {
  const col = await usersCollection()
  const user = await col.findOne({ email })
  return user ? docToRecord(user) : null
}

export async function findUserById(id: string): Promise<AirtableRecord | null> {
  const col = await usersCollection()
  const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null
  const user = await col.findOne(objectId ? { _id: objectId } : { _id: id })
  return user ? docToRecord(user) : null
}

export async function createUser(userData: {
  email: string
  name: string
  image?: string
  googleConnected?: boolean
  microsoftConnected?: boolean
  googleAccessToken?: string
  googleRefreshToken?: string
  microsoftAccessToken?: string
  microsoftRefreshToken?: string
}): Promise<AirtableRecord> {
  const col = await usersCollection()
  const now = new Date().toISOString()
  const doc: DbUser = {
    ...userData,
    googleConnected: userData.googleConnected ?? false,
    microsoftConnected: userData.microsoftConnected ?? false,
    createdAt: now,
    updatedAt: now,
  }

  const result = await col.insertOne(doc)
  return docToRecord({ ...doc, _id: result.insertedId })
}

export async function updateUser(
  id: string,
  userData: Partial<{
    name: string
    image: string
    googleConnected: boolean
    microsoftConnected: boolean
    googleAccessToken: string
    googleRefreshToken: string
    microsoftAccessToken: string
    microsoftRefreshToken: string
  }>,
): Promise<AirtableRecord> {
  const col = await usersCollection()
  const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null
  const now = new Date().toISOString()

  const result = await col.findOneAndUpdate(
    objectId ? { _id: objectId } : { _id: id },
    {
      $set: {
        ...userData,
        updatedAt: now,
      },
    },
    { returnDocument: "after" },
  )

  if (!result.value) {
    throw new Error("Failed to update user")
  }

  return docToRecord(result.value)
}

export async function saveCategorization(data: {
  userId: string
  itemId: string
  itemType: "email" | "drive" | "photo" | "onedrive"
  category: string
  confidence: number
  reasoning?: string
}): Promise<AirtableRecord> {
  const col = await categorizationsCollection()
  const now = new Date().toISOString()
  const doc: DbCategorization = { ...data, createdAt: now }

  const result = await col.insertOne(doc)
  return docToRecord({ ...doc, _id: result.insertedId })
}

export async function getCategorizations(userId: string, itemType: string): Promise<AirtableRecord[]> {
  const col = await categorizationsCollection()
  const items = await col
    .find({ userId, itemType })
    .sort({ createdAt: -1 })
    .toArray()

  return items.map(docToRecord)
}

export function airtableRecordToUser(record: AirtableRecord): import("./types").User {
  return {
    id: record.id,
    email: record.fields.email as string,
    name: record.fields.name as string,
    image: record.fields.image as string | undefined,
    googleConnected: (record.fields.googleConnected as boolean) || false,
    microsoftConnected: (record.fields.microsoftConnected as boolean) || false,
    googleAccessToken: record.fields.googleAccessToken as string | undefined,
    googleRefreshToken: record.fields.googleRefreshToken as string | undefined,
    microsoftAccessToken: record.fields.microsoftAccessToken as string | undefined,
    microsoftRefreshToken: record.fields.microsoftRefreshToken as string | undefined,
    createdAt: (record.fields.createdAt as string) || record.createdTime,
    updatedAt: (record.fields.updatedAt as string) || record.createdTime,
  }
}
