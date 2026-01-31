"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OneDriveIcon, LinkIcon } from "@/components/icons"
import {
  Loader2,
  RefreshCw,
  FolderOpen,
  FileText,
  ImageIcon,
  Video,
  Music,
  File,
  Briefcase,
  Trash2,
  Sparkles,
  ExternalLink,
  HardDrive,
} from "lucide-react"
import type { OneDriveFile } from "@/lib/types"

interface CategorizedOneDriveFile extends OneDriveFile {
  aiCategory?: "personal" | "work" | "useless"
  confidence?: number
  reasoning?: string
}

export default function OneDrivePage() {
  const { user, linkAccount } = useAuth()
  const [files, setFiles] = useState<CategorizedOneDriveFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCategorizing, setIsCategorizing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [error, setError] = useState<string | null>(null)

  const fetchFiles = useCallback(async () => {
    if (!user?.microsoftConnected) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/onedrive?top=50", { credentials: "include" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to fetch files")
      }
      const data = await res.json()
      setFiles(data.files || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch files")
    } finally {
      setIsLoading(false)
    }
  }, [user?.microsoftConnected])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const categorizeWithAI = async () => {
    if (files.length === 0) return

    setIsCategorizing(true)

    try {
      const filesToCategorize = files.filter((f) => !f.aiCategory)
      const filesForApi = filesToCategorize.map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType || "unknown",
      }))

      const res = await fetch("/api/onedrive/categorize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesForApi }),
      })

      if (!res.ok) throw new Error("Failed to categorize")

      const data = await res.json()

      setFiles((prev) =>
        prev.map((file) => {
          const cat = data.categorizations[file.id]
          if (cat) {
            return {
              ...file,
              aiCategory: cat.category,
              confidence: cat.confidence,
              reasoning: cat.reasoning,
            }
          }
          return file
        }),
      )
    } catch (err) {
      console.error("Categorization error:", err)
    } finally {
      setIsCategorizing(false)
    }
  }

  if (!user?.microsoftConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <OneDriveIcon className="h-16 w-16 opacity-50" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Connect Microsoft Account</h2>
          <p className="text-muted-foreground mb-4">Link your Microsoft account to access OneDrive</p>
          <Button onClick={() => linkAccount("microsoft")}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Connect Microsoft
          </Button>
        </div>
      </div>
    )
  }

  const filteredFiles = activeTab === "all" ? files : files.filter((f) => f.aiCategory === activeTab)

  const categoryCounts = {
    all: files.length,
    personal: files.filter((f) => f.aiCategory === "personal").length,
    work: files.filter((f) => f.aiCategory === "work").length,
    useless: files.filter((f) => f.aiCategory === "useless").length,
  }

  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <OneDriveIcon className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">OneDrive</h1>
            <p className="text-muted-foreground">AI-powered document organization</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchFiles} disabled={isLoading} className="bg-transparent">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={categorizeWithAI} disabled={isCategorizing || files.length === 0}>
            <Sparkles className={`h-4 w-4 mr-2 ${isCategorizing ? "animate-pulse" : ""}`} />
            {isCategorizing ? "Categorizing..." : "Categorize with AI"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard icon={HardDrive} label="Total Files" value={categoryCounts.all} color="text-foreground" />
        <StatsCard icon={HardDrive} label="Total Size" value={formatSize(totalSize)} color="text-primary" isText />
        <StatsCard icon={File} label="Personal" value={categoryCounts.personal} color="text-blue-400" />
        <StatsCard icon={Briefcase} label="Work" value={categoryCounts.work} color="text-green-400" />
        <StatsCard icon={Trash2} label="Useless" value={categoryCounts.useless} color="text-orange-400" />
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* File Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">All ({categoryCounts.all})</TabsTrigger>
          <TabsTrigger value="personal">Personal ({categoryCounts.personal})</TabsTrigger>
          <TabsTrigger value="work">Work ({categoryCounts.work})</TabsTrigger>
          <TabsTrigger value="useless">Useless ({categoryCounts.useless})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No files in this category</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <OneDriveFileCard key={file.id} file={file} />
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
  isText,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  color: string
  isText?: boolean
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${color}`} />
          <div>
            <p className={`${isText ? "text-lg" : "text-2xl"} font-bold text-card-foreground`}>{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OneDriveFileCard({ file }: { file: CategorizedOneDriveFile }) {
  const categoryColors = {
    personal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    work: "bg-green-500/20 text-green-400 border-green-500/30",
    useless: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  }

  const categoryLabels = {
    personal: "Personal",
    work: "Work",
    useless: "Useless",
  }

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType || mimeType === "folder") return <FolderOpen className="h-8 w-8 text-yellow-400" />
    if (mimeType.includes("image")) return <ImageIcon className="h-8 w-8 text-pink-400" />
    if (mimeType.includes("video")) return <Video className="h-8 w-8 text-purple-400" />
    if (mimeType.includes("audio")) return <Music className="h-8 w-8 text-green-400" />
    if (mimeType.includes("document") || mimeType.includes("word"))
      return <FileText className="h-8 w-8 text-blue-400" />
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
      return <FileText className="h-8 w-8 text-green-400" />
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
      return <FileText className="h-8 w-8 text-orange-400" />
    if (mimeType.includes("pdf")) return <FileText className="h-8 w-8 text-red-400" />
    return <File className="h-8 w-8 text-muted-foreground" />
  }

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0">{getFileIcon(file.mimeType)}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-card-foreground truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{formatSize(file.size)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(file.lastModifiedDateTime).toLocaleDateString()}
            </p>
            {file.aiCategory && (
              <Badge variant="outline" className={`${categoryColors[file.aiCategory]} mt-2`}>
                {categoryLabels[file.aiCategory]}
                {file.confidence && <span className="ml-1 opacity-70">{Math.round(file.confidence * 100)}%</span>}
              </Badge>
            )}
            {file.reasoning && (
              <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">{file.reasoning}</p>
            )}
          </div>
          {file.webUrl && (
            <a
              href={file.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function formatSize(bytes?: number): string {
  if (!bytes) return "Unknown"
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}
