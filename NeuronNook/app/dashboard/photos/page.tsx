"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhotosIcon, LinkIcon } from "@/components/icons"
import { Loader2, RefreshCw, ImageIcon, Calendar, MapPin, Search, X, ExternalLink, Sparkles } from "lucide-react"
import type { Photo } from "@/lib/types"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface ExtendedPhoto extends Photo {
  cameraMake?: string
  cameraModel?: string
}

function PhotosContent() {
  const { user, linkAccount } = useAuth()
  const [photos, setPhotos] = useState<ExtendedPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isCategorizing, setIsCategorizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<ExtendedPhoto | null>(null)

  // Search filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [isFiltered, setIsFiltered] = useState(false)

  const fetchPhotos = useCallback(async () => {
    if (!user?.googleConnected) return

    setIsLoading(true)
    setError(null)
    setIsFiltered(false)

    try {
      const res = await fetch("/api/photos?pageSize=50")
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to fetch photos")
      }
      const data = await res.json()
      setPhotos(data.photos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch photos")
    } finally {
      setIsLoading(false)
    }
  }, [user?.googleConnected])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const searchPhotos = async () => {
    if (!startDate && !endDate && !locationQuery) {
      fetchPhotos()
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const res = await fetch("/api/photos/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          pageSize: 50,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to search photos")
      }

      const data = await res.json()
      let filteredPhotos = data.photos || []

      // Client-side location filtering (since Google Photos API doesn't support text search for location)
      if (locationQuery) {
        filteredPhotos = filteredPhotos.filter(
          (photo: ExtendedPhoto) =>
            photo.filename?.toLowerCase().includes(locationQuery.toLowerCase()) ||
            photo.location?.locationName?.toLowerCase().includes(locationQuery.toLowerCase()),
        )
      }

      setPhotos(filteredPhotos)
      setIsFiltered(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search photos")
    } finally {
      setIsSearching(false)
    }
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setLocationQuery("")
    fetchPhotos()
  }

  const categorizeWithAI = async () => {
    if (photos.length === 0) return

    setIsCategorizing(true)

    try {
      const photosToCategorizeFull = photos.filter((p) => !p.commonName)
      const photosForApi = photosToCategorizeFull.map((p) => ({
        id: p.id,
        filename: p.filename,
        creationTime: p.creationTime,
        location: p.location,
      }))

      const res = await fetch("/api/photos/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: photosForApi }),
      })

      if (!res.ok) throw new Error("Failed to categorize photos")

      const data = await res.json()

      setPhotos((prev) =>
        prev.map((photo) => {
          const cat = data.categorizations[photo.id]
          if (cat) {
            return {
              ...photo,
              commonName: cat.commonName,
              confidence: cat.confidence,
              aiDescription: cat.description,
            }
          }
          return photo
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
        <PhotosIcon className="h-16 w-16 opacity-50" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Connect Google Account</h2>
          <p className="text-muted-foreground mb-4">Link your Google account to access Photos</p>
          <Button onClick={() => linkAccount("google")}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Connect Google
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PhotosIcon className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Google Photos</h1>
            <p className="text-muted-foreground">Search by date or location</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPhotos} disabled={isLoading} className="bg-transparent">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={categorizeWithAI} disabled={isCategorizing || photos.length === 0}>
            <Sparkles className={`h-4 w-4 mr-2 ${isCategorizing ? "animate-pulse" : ""}`} />
            {isCategorizing ? "Naming..." : "Add Common Names"}
          </Button>
        </div>
      </div>

      {/* Search Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Location
              </Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., Paris, Beach"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={searchPhotos} disabled={isSearching} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? "Searching..." : "Search"}
              </Button>
              {isFiltered && (
                <Button variant="outline" onClick={clearFilters} className="bg-transparent">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
          <span>
            {photos.length} photos {isFiltered && "(filtered)"}
          </span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Photos Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : photos.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {isFiltered ? "No photos match your search criteria" : "No photos found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onClick={() => setSelectedPhoto(photo)} />
          ))}
        </div>
      )}

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl bg-card border-border">
          <VisuallyHidden>
            <DialogTitle>Photo Details</DialogTitle>
          </VisuallyHidden>
          {selectedPhoto && <PhotoDetail photo={selectedPhoto} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PhotosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PhotosContent />
    </Suspense>
  )
}

function PhotoCard({ photo, onClick }: { photo: ExtendedPhoto; onClick: () => void }) {
  return (
    <div
      className="aspect-square relative rounded-lg overflow-hidden cursor-pointer group bg-secondary"
      onClick={onClick}
    >
      <Image
        src={`${photo.baseUrl}=w400-h400-c`}
        alt={photo.filename || "Photo"}
        fill
        className="object-cover transition-transform group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
      />
      {photo.commonName && (
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="mb-1 text-xs">
            {photo.commonName}
            {photo.confidence && <span className="ml-1 opacity-70">{Math.round(photo.confidence * 100)}%</span>}
          </Badge>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-xs text-foreground truncate">{photo.filename}</p>
          {photo.creationTime && (
            <p className="text-xs text-muted-foreground">{new Date(photo.creationTime).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function PhotoDetail({ photo }: { photo: ExtendedPhoto }) {
  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
        <Image
          src={`${photo.baseUrl}=w1200-h800`}
          alt={photo.filename || "Photo"}
          fill
          className="object-contain"
          sizes="1200px"
        />
        {photo.commonName && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="secondary" className="text-xs">
              {photo.commonName}
            </Badge>
          </div>
        )}
      </div>
      {photo.aiDescription && (
        <p className="text-sm text-muted-foreground italic">{photo.aiDescription}</p>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium text-card-foreground">{photo.filename}</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            {photo.creationTime && (
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(photo.creationTime).toLocaleString()}
              </p>
            )}
            {photo.location?.locationName && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {photo.location.locationName}
              </p>
            )}
            <p className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {photo.width} x {photo.height}
            </p>
            {photo.cameraMake && (
              <p>
                Camera: {photo.cameraMake} {photo.cameraModel}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end items-start">
          <a
            href={photo.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Google Photos
          </a>
        </div>
      </div>
    </div>
  )
}
