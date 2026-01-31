import { ObjectId, type ModifyResult } from "mongodb"

import { getDb } from "./mongodb"

export type DbRecord<T> = {
  id: string
  data: T
  createdTime: string
}

type CleanDoc<T extends { _id?: ObjectId | string }> = Omit<T, "_id"> & { _id?: ObjectId | string }

type DbUser = {
  _id?: ObjectId | string
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
  _id?: ObjectId | string
  userId: string
  itemId: string
  itemType: "email" | "drive" | "photo" | "onedrive"
  category: string
  confidence: number
  reasoning?: string
  createdAt?: string
}

function docToRecord<T extends { _id?: ObjectId | string; createdAt?: string }>(doc: T): DbRecord<T> {
  const { _id, ...rest } = doc
  const createdTime = doc.createdAt || new Date().toISOString()

  return {
    id: (_id || "").toString(),
    data: { ...(rest as object), _id } as T,
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

export async function findUserByEmail(email: string): Promise<DbRecord<DbUser> | null> {
  const col = await usersCollection()
  const user = await col.findOne({ email })
  return user ? docToRecord(user) : null
}

export async function findUserById(id: string): Promise<DbRecord<DbUser> | null> {
  const col = await usersCollection()
  const queries: Array<{ _id?: ObjectId | string; email?: string }> = ObjectId.isValid(id)
    ? [{ _id: new ObjectId(id) }, { _id: id }]
    : [{ _id: id }]

  const user = await col.findOne({ $or: queries })
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
}): Promise<DbRecord<DbUser>> {
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
    email: string
    name: string
    image: string
    googleConnected: boolean
    microsoftConnected: boolean
    googleAccessToken: string
    googleRefreshToken: string
    microsoftAccessToken: string
    microsoftRefreshToken: string
  }>,
): Promise<DbRecord<DbUser>> {
  const col = await usersCollection()
  const queries: Array<{ _id?: ObjectId | string; email?: string }> = ObjectId.isValid(id)
    ? [{ _id: new ObjectId(id) }, { _id: id }]
    : [{ _id: id }]

  if (userData.email) {
    queries.push({ email: userData.email })
  }

  const now = new Date().toISOString()

  const setOnInsert: { email?: string; createdAt: string } = { createdAt: now }
  if (userData.email) {
    setOnInsert.email = userData.email
  }

  const result = (await col.findOneAndUpdate(
    { $or: queries },
    {
      $set: {
        ...userData,
        updatedAt: now,
      },
      $setOnInsert: setOnInsert,
    },
    { returnDocument: "after", upsert: true },
  )) as ModifyResult<DbUser> | null

  let value = result?.value
  
  // If findOneAndUpdate returns null but we expect a document to exist,
  // try fetching it again by id to ensure we get the updated document
  if (!value) {
    const queries2: Array<{ _id?: ObjectId | string; email?: string }> = ObjectId.isValid(id)
      ? [{ _id: new ObjectId(id) }, { _id: id }]
      : [{ _id: id }]
    
    const existingUser = await col.findOne({ $or: queries2 })
    if (existingUser) {
      value = existingUser
    } else {
      throw new Error(`Failed to update user with id: ${id}`)
    }
  }

  return docToRecord(value)
}

export async function saveCategorization(data: {
  userId: string
  itemId: string
  itemType: "email" | "drive" | "photo" | "onedrive"
  category: string
  confidence: number
  reasoning?: string
}): Promise<DbRecord<DbCategorization>> {
  const col = await categorizationsCollection()
  const now = new Date().toISOString()
  const doc: DbCategorization = { ...data, createdAt: now }

  const result = await col.insertOne(doc)
  return docToRecord({ ...doc, _id: result.insertedId })
}

export async function getCategorizations(
  userId: string,
  itemType: DbCategorization["itemType"],
): Promise<Array<DbRecord<DbCategorization>>> {
  const col = await categorizationsCollection()
  const items = await col
    .find({ userId, itemType })
    .sort({ createdAt: -1 })
    .toArray()

  return items.map(docToRecord)
}

export function dbRecordToUser(record: DbRecord<DbUser>): import("./types").User {
  return {
    id: record.id,
    email: record.data.email,
    name: record.data.name,
    image: record.data.image,
    googleConnected: record.data.googleConnected || false,
    microsoftConnected: record.data.microsoftConnected || false,
    googleAccessToken: record.data.googleAccessToken,
    googleRefreshToken: record.data.googleRefreshToken,
    microsoftAccessToken: record.data.microsoftAccessToken,
    microsoftRefreshToken: record.data.microsoftRefreshToken,
    createdAt: record.data.createdAt || record.createdTime,
    updatedAt: record.data.updatedAt || record.createdTime,
  }
}
