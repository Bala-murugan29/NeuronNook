"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GmailIcon, LinkIcon } from "@/components/icons"
import { Loader2, RefreshCw, Mail, Briefcase, AlertTriangle, Sparkles, ExternalLink } from "lucide-react"
import { AIInsightsCard } from "@/components/dashboard/ai-insights"
import type { Email } from "@/lib/types"

interface CategorizedEmail extends Email {
  aiCategory?: "personal" | "work" | "spam_promotion"
  confidence?: number
  reasoning?: string
}

export default function GmailPage() {
  const { user, linkAccount } = useAuth()
  const [emails, setEmails] = useState<CategorizedEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCategorizing, setIsCategorizing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [error, setError] = useState<string | null>(null)

  const fetchEmails = useCallback(async () => {
    if (!user?.googleConnected) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/gmail?maxResults=30")
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to fetch emails")
      }
      const data = await res.json()
      setEmails(data.emails || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch emails")
    } finally {
      setIsLoading(false)
    }
  }, [user?.googleConnected])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const categorizeWithAI = async () => {
    if (emails.length === 0) return

    setIsCategorizing(true)

    try {
      const emailsToCategorizeFull = emails.filter((e) => !e.aiCategory)
      const emailsForApi = emailsToCategorizeFull.map((e) => ({
        id: e.id,
        from: e.from,
        subject: e.subject,
        snippet: e.snippet,
      }))

      const endpoint = "/api/gmail/categorize-gemini"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailsForApi }),
      })

      if (!res.ok) throw new Error("Failed to categorize")

      const data = await res.json()

      setEmails((prev) =>
        prev.map((email) => {
          const cat = data.categorizations[email.id]
          if (cat) {
            return {
              ...email,
              aiCategory: cat.category,
              confidence: cat.confidence,
              reasoning: cat.reasoning,
            }
          }
          return email
        }),
      )
    } catch (err) {
      console.error("Categorization error:", err)
    } finally {
      setIsCategorizing(false)
    }
  }

  if (!user?.googleConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <GmailIcon className="h-16 w-16 opacity-50" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Connect Google Account</h2>
          <p className="text-muted-foreground mb-4">Link your Google account to access Gmail</p>
          <Button onClick={() => linkAccount("google")}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Connect Google
          </Button>
        </div>
      </div>
    )
  }

  const filteredEmails =
    activeTab === "all"
      ? emails
      : emails.filter((e) => e.aiCategory === activeTab || (!e.aiCategory && activeTab === "uncategorized"))

  const categoryCounts = {
    all: emails.length,
    personal: emails.filter((e) => e.aiCategory === "personal").length,
    work: emails.filter((e) => e.aiCategory === "work").length,
    spam_promotion: emails.filter((e) => e.aiCategory === "spam_promotion").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GmailIcon className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gmail</h1>
            <p className="text-muted-foreground">AI-powered email categorization</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEmails} disabled={isLoading} className="bg-transparent">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={categorizeWithAI} disabled={isCategorizing || emails.length === 0}>
            <Sparkles className={`h-4 w-4 mr-2 ${isCategorizing ? "animate-pulse" : ""}`} />
            {isCategorizing ? "Categorizing with Gemini..." : "Categorize with Gemini"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard icon={Mail} label="Total" value={categoryCounts.all} color="text-foreground" />
        <StatsCard icon={Mail} label="Personal" value={categoryCounts.personal} color="text-blue-400" />
        <StatsCard icon={Briefcase} label="Work" value={categoryCounts.work} color="text-green-400" />
        <StatsCard
          icon={AlertTriangle}
          label="Spam/Promo"
          value={categoryCounts.spam_promotion}
          color="text-orange-400"
        />
      </div>

      {/* AI Insights Card */}
      {emails.length > 0 && (
        <AIInsightsCard
          type="email"
          items={emails.map((e) => ({
            category: e.aiCategory || "personal",
            confidence: e.confidence || 0.5,
          }))}
        />
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Email Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">All ({categoryCounts.all})</TabsTrigger>
          <TabsTrigger value="personal">Personal ({categoryCounts.personal})</TabsTrigger>
          <TabsTrigger value="work">Work ({categoryCounts.work})</TabsTrigger>
          <TabsTrigger value="spam_promotion">Spam/Promo ({categoryCounts.spam_promotion})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEmails.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No emails in this category</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredEmails.map((email) => (
                <EmailCard key={email.id} email={email} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatsCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${color}`} />
          <div>
            <p className="text-2xl font-bold text-card-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmailCard({ email }: { email: CategorizedEmail }) {
  const categoryColors = {
    personal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    work: "bg-green-500/20 text-green-400 border-green-500/30",
    spam_promotion: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  }

  const categoryLabels = {
    personal: "Personal",
    work: "Work",
    spam_promotion: "Spam/Promo",
  }

  return (
    <Card
      className={`bg-card border-border hover:border-primary/30 transition-colors ${!email.isRead ? "border-l-2 border-l-primary" : ""}`}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-card-foreground truncate">{email.from.split("<")[0].trim()}</span>
              {!email.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
              {email.aiCategory && (
                <Badge variant="outline" className={`${categoryColors[email.aiCategory]} shrink-0`}>
                  {categoryLabels[email.aiCategory]}
                  {email.confidence && <span className="ml-1 opacity-70">{Math.round(email.confidence * 100)}%</span>}
                </Badge>
              )}
            </div>
            <p className="text-sm text-card-foreground font-medium truncate">{email.subject || "(No subject)"}</p>
            <p className="text-sm text-muted-foreground truncate mt-1">{email.snippet}</p>
            {email.reasoning && <p className="text-xs text-muted-foreground mt-2 italic">{email.reasoning}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{formatDate(email.date)}</span>
            <a
              href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  } catch {
    return dateString
  }
}
