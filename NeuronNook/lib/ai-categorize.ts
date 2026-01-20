import { generateObject } from "ai"
import { z } from "zod"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

// Email categorization schema
const emailCategorySchema = z.object({
  category: z.enum(["personal", "work", "spam_promotion"]).describe("The category of the email"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
  reasoning: z.string().describe("Brief explanation for the categorization"),
})

// File categorization schema
const fileCategorySchema = z.object({
  category: z.enum(["personal", "work", "useless"]).describe("The category of the file"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
  reasoning: z.string().describe("Brief explanation for the categorization"),
})

export async function categorizeEmail(email: {
  from: string
  subject: string
  snippet: string
}): Promise<z.infer<typeof emailCategorySchema>> {
  const { object } = await generateObject({
    model: "openrouter/deepseek/deepseek-r1",
    schema: emailCategorySchema,
    prompt: `Categorize this email into one of three categories:
- personal: Personal emails from friends, family, personal subscriptions, personal notifications
- work: Work-related emails, professional correspondence, business communications, work notifications
- spam_promotion: Spam, promotional emails, marketing, newsletters, ads, unsolicited emails

Email details:
From: ${email.from}
Subject: ${email.subject}
Preview: ${email.snippet}

Analyze and categorize this email.`,
    maxOutputTokens: 500,
  })

  return object
}

export async function categorizeEmails(
  emails: Array<{ id: string; from: string; subject: string; snippet: string }>,
): Promise<Map<string, z.infer<typeof emailCategorySchema>>> {
  const results = new Map<string, z.infer<typeof emailCategorySchema>>()

  // Process emails in batches to avoid rate limits
  const batchSize = 5
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    const promises = batch.map(async (email) => {
      try {
        const result = await categorizeEmail(email)
        return { id: email.id, result }
      } catch (error) {
        console.error(`Failed to categorize email ${email.id}:`, error)
        return {
          id: email.id,
          result: {
            category: "personal" as const,
            confidence: 0.5,
            reasoning: "Failed to categorize, defaulting to personal",
          },
        }
      }
    })

    const batchResults = await Promise.all(promises)
    for (const { id, result } of batchResults) {
      results.set(id, result)
    }
  }

  return results
}

export async function categorizeFile(file: {
  name: string
  mimeType: string
}): Promise<z.infer<typeof fileCategorySchema>> {
  const { object } = await generateObject({
    model: "openrouter/deepseek/deepseek-r1",
    schema: fileCategorySchema,
    prompt: `Categorize this file into one of three categories:
- personal: Personal files like photos, personal documents, entertainment, personal projects
- work: Work-related documents, spreadsheets, presentations, professional materials
- useless: Temporary files, duplicates, outdated files, junk, auto-generated files

File details:
Name: ${file.name}
Type: ${file.mimeType}

Analyze and categorize this file based on its name and type.`,
    maxOutputTokens: 500,
  })

  return object
}

export async function categorizeFiles(
  files: Array<{ id: string; name: string; mimeType: string }>,
): Promise<Map<string, z.infer<typeof fileCategorySchema>>> {
  const results = new Map<string, z.infer<typeof fileCategorySchema>>()

  const batchSize = 5
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    const promises = batch.map(async (file) => {
      try {
        const result = await categorizeFile(file)
        return { id: file.id, result }
      } catch (error) {
        console.error(`Failed to categorize file ${file.id}:`, error)
        return {
          id: file.id,
          result: {
            category: "personal" as const,
            confidence: 0.5,
            reasoning: "Failed to categorize, defaulting to personal",
          },
        }
      }
    })

    const batchResults = await Promise.all(promises)
    for (const { id, result } of batchResults) {
      results.set(id, result)
    }
  }

  return results
}
