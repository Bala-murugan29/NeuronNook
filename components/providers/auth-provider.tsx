"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import type { AuthState } from "@/lib/types"

interface AuthContextType extends AuthState {
  login: (provider: "google" | "microsoft") => void
  logout: () => void
  linkAccount: (provider: "google" | "microsoft") => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      if (res.ok) {
        const user = await res.json()
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = (provider: "google" | "microsoft") => {
    window.location.href = `/api/auth/${provider}`
  }

  const linkAccount = (provider: "google" | "microsoft") => {
    window.location.href = `/api/auth/${provider}?link=true`
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
    window.location.href = "/"
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        linkAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
