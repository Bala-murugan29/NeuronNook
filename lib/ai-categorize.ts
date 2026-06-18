import { generateObject } from "ai"
import { z } from "zod"
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY
const NVIDIA_NIM_MODEL = process.env.NVIDIA_NIM_MODEL || "meta/llama-3.1-8b-instruct"

export async function callNvidiaNim(prompt: string, options?: { model?: string }): Promise<string> {
  const apiKey = NVIDIA_API_KEY
  if (!apiKey) {
    throw new Error("NVIDIA API key not configured. Please set NVIDIA_API_KEY in .env")
  }

  const modelName = options?.model || NVIDIA_NIM_MODEL

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "")
    throw new Error(`NVIDIA NIM API error (${response.status}): ${response.statusText}. ${errorBody}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("NVIDIA NIM returned an empty response")
  }

  return content
}

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

// NVIDIA NIM AI functions
export async function categorizeEmailWithNvidiaNim(email: {
  from: string
  subject: string
  snippet: string
}): Promise<z.infer<typeof emailCategorySchema>> {
  try {
    const prompt = `Categorize this email into one of three categories:
- personal: Personal emails from friends, family, personal subscriptions, personal notifications
- work: Work-related emails, professional correspondence, business communications, work notifications
- spam_promotion: Spam, promotional emails, marketing, newsletters, ads, unsolicited emails

Email details:
From: ${email.from}
Subject: ${email.subject}
Preview: ${email.snippet}

Respond in JSON format with the following structure:
{
  "category": "personal" | "work" | "spam_promotion",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation"
}`

    const responseText = await callNvidiaNim(prompt)
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    return {
      category: parsed.category as "personal" | "work" | "spam_promotion",
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || "Categorized by NVIDIA NIM",
    }
  } catch (error) {
    console.error("NVIDIA NIM email categorization error:", error)
    throw error
  }
}

export async function categorizeEmailsWithNvidiaNim(
  emails: Array<{ id: string; from: string; subject: string; snippet: string }>,
): Promise<Map<string, z.infer<typeof emailCategorySchema>>> {
  const results = new Map<string, z.infer<typeof emailCategorySchema>>()

  // Process emails in batches to avoid rate limits
  const batchSize = 5
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    const promises = batch.map(async (email) => {
      try {
        const result = await categorizeEmailWithNvidiaNim(email)
        return { id: email.id, result }
      } catch (error) {
        console.error(`Failed to categorize email ${email.id} with NVIDIA NIM:`, error)
        return {
          id: email.id,
          result: {
            category: "personal" as const,
            confidence: 0.5,
            reasoning: "Failed to categorize with NVIDIA NIM, defaulting to personal",
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

export async function categorizeFileWithNvidiaNim(file: {
  name: string
  mimeType: string
}): Promise<z.infer<typeof fileCategorySchema>> {
  const prompt = `Categorize this file into one of three categories:
- personal: Personal files like photos, personal documents, entertainment, personal projects
- work: Work-related documents, spreadsheets, presentations, professional materials
- useless: Temporary files, duplicates, outdated files, junk, auto-generated files

File details:
Name: ${file.name}
Type: ${file.mimeType}

Respond in JSON format with the following structure:
{
  "category": "personal" | "work" | "useless",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation"
}`

  try {
    const responseText = await callNvidiaNim(prompt)
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    return {
      category: parsed.category as "personal" | "work" | "useless",
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || "Categorized by NVIDIA NIM",
    }
  } catch (error) {
    console.error("NVIDIA NIM file categorization error:", error)
    return {
      category: "personal",
      confidence: 0.5,
      reasoning: "Failed to categorize with NVIDIA NIM, defaulting to personal",
    }
  }
}

export async function categorizeFilesWithNvidiaNim(
  files: Array<{ id: string; name: string; mimeType: string }>,
): Promise<Map<string, z.infer<typeof fileCategorySchema>>> {
  const results = new Map<string, z.infer<typeof fileCategorySchema>>()

  const batchSize = 5
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    const promises = batch.map(async (file) => {
      try {
        const result = await categorizeFileWithNvidiaNim(file)
        return { id: file.id, result }
      } catch (error) {
        console.error(`Failed to categorize file ${file.id} with NVIDIA NIM:`, error)
        return {
          id: file.id,
          result: {
            category: "personal" as const,
            confidence: 0.5,
            reasoning: "Failed to categorize with NVIDIA NIM, defaulting to personal",
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

// Dashboard analytics using NVIDIA NIM
export interface DashboardInsights {
  summary: string
  keyMetrics: {
    totalItems: number
    personalItems: number
    workItems: number
    uselessItems: number
    personalPercentage: number
    workPercentage: number
    recommendation: string
  }
}

export async function generateDashboardInsights(
  dashboardData: {
    type: "email" | "file"
    items: Array<{ category: string; confidence: number }>
  },
): Promise<DashboardInsights> {
  // Calculate metrics
  const totalItems = dashboardData.items.length
  const personalItems = dashboardData.items.filter((i) => i.category === "personal").length
  const workItems = dashboardData.items.filter((i) => i.category === "work").length
  const uselessItems = dashboardData.items.filter(
    (i) => (dashboardData.type === "file" && i.category === "useless") || (dashboardData.type === "email" && i.category === "spam_promotion"),
  ).length

  const personalPercentage = totalItems > 0 ? Math.round((personalItems / totalItems) * 100) : 0
  const workPercentage = totalItems > 0 ? Math.round((workItems / totalItems) * 100) : 0

  const prompt = `Based on these ${dashboardData.type} categorization statistics, provide insights:
- Total ${dashboardData.type}s: ${totalItems}
- Personal: ${personalItems} (${personalPercentage}%)
- Work: ${workItems} (${workPercentage}%)
- ${dashboardData.type === "file" ? "Useless" : "Spam/Promotional"}: ${uselessItems} (${100 - personalPercentage - workPercentage}%)

Provide a brief professional summary (1-2 sentences) and one actionable recommendation for organization or cleanup. Respond in JSON format:
{
  "summary": "Brief overview",
  "recommendation": "Actionable suggestion"
}`

  try {
    const responseText = await callNvidiaNim(prompt)
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    return {
      summary: parsed.summary || "Unable to generate summary",
      keyMetrics: {
        totalItems,
        personalItems,
        workItems,
        uselessItems,
        personalPercentage,
        workPercentage,
        recommendation: parsed.recommendation || "Review and organize regularly",
      },
    }
  } catch (error) {
    console.error("Dashboard insights generation error:", error)
    return {
      summary: "Analytics unavailable",
      keyMetrics: {
        totalItems,
        personalItems,
        workItems,
        uselessItems,
        personalPercentage,
        workPercentage,
        recommendation: "Please try again later",
      },
    }
  }
}
