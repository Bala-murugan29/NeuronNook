"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, RefreshCw, Trash2 } from "lucide-react"

interface TokenInfo {
  tokenInfo: {
    scope: string
    expires_in: number
    email?: string
  }
  analysis: {
    totalScopes: number
    scopes: string[]
    hasRequiredScopes: {
      "photoslibrary.readonly": boolean
      photoslibrary: boolean
      "gmail.readonly": boolean
      "drive.readonly": boolean
    }
    verdict: string
  }
}

export default function TokenDiagnostics() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  const checkToken = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/tokeninfo")
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to get token info")
      }
      const data = await response.json()
      setTokenInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const clearTokens = async () => {
    if (!confirm("This will clear all your tokens and you'll need to log in again. Continue?")) {
      return
    }

    setClearing(true)
    try {
      const response = await fetch("/api/auth/clear-tokens", { method: "POST" })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to clear tokens")
      }
      alert("Tokens cleared! Please log in again.")
      window.location.href = "/api/auth/logout"
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setClearing(false)
    }
  }

  useEffect(() => {
    checkToken()
  }, [])

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>OAuth Token Diagnostics</CardTitle>
          <CardDescription>Verify what scopes are in your current access token</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkToken} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Check Token
            </Button>
            <Button onClick={clearTokens} disabled={clearing} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Tokens
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {tokenInfo && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription className="font-semibold text-lg">
                  {tokenInfo.analysis.verdict}
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Required Scopes Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(tokenInfo.analysis.hasRequiredScopes).map(([scope, has]) => (
                    <div key={scope} className="flex items-center justify-between">
                      <span className="font-mono text-sm">{scope}</span>
                      {has ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Present
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Missing
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    All Scopes ({tokenInfo.analysis.totalScopes})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {tokenInfo.analysis.scopes.map((scope, idx) => (
                      <div key={idx} className="font-mono text-xs bg-muted p-2 rounded">
                        {scope}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Token Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Email:</strong> {tokenInfo.tokenInfo.email || "N/A"}
                  </div>
                  <div>
                    <strong>Expires in:</strong> {tokenInfo.tokenInfo.expires_in} seconds (
                    {Math.round(tokenInfo.tokenInfo.expires_in / 60)} minutes)
                  </div>
                </CardContent>
              </Card>

              {!tokenInfo.analysis.hasRequiredScopes["photoslibrary.readonly"] &&
                !tokenInfo.analysis.hasRequiredScopes.photoslibrary && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <strong>Action Required:</strong>
                      <ol className="list-decimal ml-4 mt-2 space-y-1">
                        <li>Click "Clear All Tokens" above</li>
                        <li>Log out and log back in</li>
                        <li>Make sure to accept ALL scopes in the Google consent screen</li>
                        <li>Return to this page to verify</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
