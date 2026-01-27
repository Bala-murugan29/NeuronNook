"use client"

import type React from "react"

import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleIcon, MicrosoftIcon, GmailIcon, DriveIcon, PhotosIcon, OneDriveIcon } from "@/components/icons"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2, Cloud, Shield, Zap } from "lucide-react"

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold text-foreground">CloudHub</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            All Your Cloud Services, <span className="text-primary">One Dashboard</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Connect your Google and Microsoft accounts to access Gmail, Drive, Photos, and OneDrive with AI-powered
            organization and smart categorization.
          </p>
        </div>

        {/* Login Card */}
        <div className="max-w-md mx-auto mb-20">
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-card-foreground">Get Started</CardTitle>
              <CardDescription>Sign in with your preferred provider</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-12 text-base border-border hover:bg-secondary bg-transparent"
                onClick={() => login("google")}
              >
                <GoogleIcon className="h-5 w-5 mr-3" />
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-base border-border hover:bg-secondary bg-transparent"
                onClick={() => login("microsoft")}
              >
                <MicrosoftIcon className="h-5 w-5 mr-3" />
                Continue with Microsoft
              </Button>
              <p className="text-xs text-center text-muted-foreground pt-2">
                You can link additional accounts after signing in
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-20">
          <FeatureCard
            icon={<GmailIcon className="h-8 w-8" />}
            title="Gmail"
            description="AI categorizes emails into Personal, Work, and Spam"
          />
          <FeatureCard
            icon={<DriveIcon className="h-8 w-8" />}
            title="Google Drive"
            description="Smart organization of your files and documents"
          />
          <FeatureCard
            icon={<PhotosIcon className="h-8 w-8" />}
            title="Google Photos"
            description="Search by date or location tags"
          />
          <FeatureCard
            icon={<OneDriveIcon className="h-8 w-8" />}
            title="OneDrive"
            description="Documents sorted into Personal, Work, and Archive"
          />
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <BenefitCard
            icon={<Zap className="h-6 w-6 text-primary" />}
            title="AI-Powered"
            description="DeepSeek R1 intelligently categorizes your content"
          />
          <BenefitCard
            icon={<Shield className="h-6 w-6 text-primary" />}
            title="Secure"
            description="OAuth 2.0 authentication with encrypted tokens"
          />
          <BenefitCard
            icon={<Cloud className="h-6 w-6 text-primary" />}
            title="Unified"
            description="Access all your cloud services from one place"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-6 py-8 text-center text-muted-foreground text-sm">
          CloudHub - Unified Cloud Dashboard
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="pt-6">
        <div className="mb-4">{icon}</div>
        <h3 className="font-semibold text-card-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary mb-4">{icon}</div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
