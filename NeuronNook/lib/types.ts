// User and authentication types
export interface User {
  id: string
  email: string
  name: string
  image?: string
  googleConnected: boolean
  microsoftConnected: boolean
  googleAccessToken?: string
  googleRefreshToken?: string
  microsoftAccessToken?: string
  microsoftRefreshToken?: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Email types
export interface Email {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  snippet: string
  body?: string
  date: string
  isRead: boolean
  labels: string[]
  category?: "personal" | "work" | "spam_promotion"
}

// Drive file types
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: number
  modifiedTime: string
  webViewLink?: string
  iconLink?: string
  category?: "personal" | "work" | "useless"
}

// Photo types
export interface Photo {
  id: string
  baseUrl: string
  productUrl: string
  mimeType: string
  filename: string
  creationTime: string
  width: number
  height: number
  location?: {
    latitude: number
    longitude: number
    locationName?: string
  }
  commonName?: string
  confidence?: number
  aiDescription?: string
}

// OneDrive file types
export interface OneDriveFile {
  id: string
  name: string
  size: number
  lastModifiedDateTime: string
  webUrl?: string
  mimeType?: string
  category?: "personal" | "work" | "useless"
}

// Categorization result
export interface CategorizedItem<T> {
  item: T
  category: string
  confidence: number
  reasoning?: string
}
