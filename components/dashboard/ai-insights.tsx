"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, TrendingUp } from "lucide-react"

interface DashboardInsightsData {
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

export function AIInsightsCard({
  type,
  items,
}: {
  type: "email" | "file"
  items: Array<{ category: string; confidence: number }>
}) {
  const [insights, setInsights] = useState<DashboardInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      if (!items || items.length === 0) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/dashboard/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, items }),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch insights")
        }

        const data = await response.json()
        setInsights(data)
      } catch (err) {
        console.error("Error fetching insights:", err)
        setError(err instanceof Error ? err.message : "Failed to load insights")
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [type, items])

  if (loading) {
    return null
  }

  if (error || !insights) {
    return null
  }

  const uselessPercentage = 100 - insights.keyMetrics.personalPercentage - insights.keyMetrics.workPercentage

  return (
    <Card className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription className="mt-2">{insights.summary}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Personal</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {insights.keyMetrics.personalPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">
                ({insights.keyMetrics.personalItems})
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Work</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {insights.keyMetrics.workPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">
                ({insights.keyMetrics.workItems})
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {type === "file" ? "Useless" : "Spam"}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {uselessPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">
                ({insights.keyMetrics.uselessItems})
              </span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-white dark:bg-slate-950 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 mt-1 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Recommendation</p>
              <p className="text-sm text-muted-foreground mt-1">
                {insights.keyMetrics.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Total Count */}
        <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
          <p className="text-xs text-muted-foreground">
            Analyzed <Badge variant="secondary">{insights.keyMetrics.totalItems}</Badge> items
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
