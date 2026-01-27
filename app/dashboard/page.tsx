"use client"

import type React from "react"
import { Suspense } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GmailIcon, DriveIcon, PhotosIcon, OneDriveIcon, GoogleIcon, MicrosoftIcon } from "@/components/icons"
import { LinkIcon, Mail, FolderOpen, ImageIcon, HardDrive, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

function DashboardContent() {
  const { user, isLoading, linkAccount, refreshUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const linked = searchParams.get("linked")
    if (linked) {
      toast.success(`${linked.charAt(0).toUpperCase() + linked.slice(1)} account linked successfully!`)
      refreshUser()
      router.replace("/dashboard")
    }
  }, [searchParams, refreshUser, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0] || "User"}</h2>
        <p className="text-muted-foreground mt-1">Manage your cloud services from one unified dashboard</p>
      </div>

      {/* Connection Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <ConnectionCard
          provider="Google"
          connected={user?.googleConnected || false}
          icon={<GoogleIcon className="h-8 w-8" />}
          services={["Gmail", "Drive", "Photos"]}
          onConnect={() => linkAccount("google")}
        />
        <ConnectionCard
          provider="Microsoft"
          connected={user?.microsoftConnected || false}
          icon={<MicrosoftIcon className="h-8 w-8" />}
          services={["OneDrive"]}
          onConnect={() => linkAccount("microsoft")}
        />
      </div>

      {/* Service Cards */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Your Services</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ServiceCard
            name="Gmail"
            description="AI-categorized emails"
            icon={<GmailIcon className="h-6 w-6" />}
            href="/dashboard/gmail"
            enabled={user?.googleConnected || false}
            stats={<StatItem icon={Mail} value="--" label="emails" />}
          />
          <ServiceCard
            name="Drive"
            description="Organized files"
            icon={<DriveIcon className="h-6 w-6" />}
            href="/dashboard/drive"
            enabled={user?.googleConnected || false}
            stats={<StatItem icon={FolderOpen} value="--" label="files" />}
          />
          <ServiceCard
            name="Photos"
            description="Search by date/location"
            icon={<PhotosIcon className="h-6 w-6" />}
            href="/dashboard/photos"
            enabled={user?.googleConnected || false}
            stats={<StatItem icon={ImageIcon} value="--" label="photos" />}
          />
          <ServiceCard
            name="OneDrive"
            description="Categorized documents"
            icon={<OneDriveIcon className="h-6 w-6" />}
            href="/dashboard/onedrive"
            enabled={user?.microsoftConnected || false}
            stats={<StatItem icon={HardDrive} value="--" label="files" />}
          />
        </div>
      </div>

      {/* Quick Actions */}
      {(user?.googleConnected || user?.microsoftConnected) && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {user?.googleConnected && (
              <>
                <Link href="/dashboard/gmail">
                  <Button variant="outline" className="bg-transparent">
                    <Mail className="h-4 w-4 mr-2" />
                    Check Emails
                  </Button>
                </Link>
                <Link href="/dashboard/drive">
                  <Button variant="outline" className="bg-transparent">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Browse Drive
                  </Button>
                </Link>
                <Link href="/dashboard/photos">
                  <Button variant="outline" className="bg-transparent">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    View Photos
                  </Button>
                </Link>
              </>
            )}
            {user?.microsoftConnected && (
              <Link href="/dashboard/onedrive">
                <Button variant="outline" className="bg-transparent">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Browse OneDrive
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}

function ConnectionCard({
  provider,
  connected,
  icon,
  services,
  onConnect,
}: {
  provider: string
  connected: boolean
  icon: React.ReactNode
  services: string[]
  onConnect: () => void
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="p-3 rounded-lg bg-secondary">{icon}</div>
        <div className="flex-1">
          <CardTitle className="text-lg">{provider}</CardTitle>
          <CardDescription>{services.join(", ")}</CardDescription>
        </div>
        {connected ? (
          <span className="text-sm text-green-500 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Connected
          </span>
        ) : (
          <Button onClick={onConnect} size="sm">
            <LinkIcon className="h-4 w-4 mr-2" />
            Connect
          </Button>
        )}
      </CardHeader>
      {connected && (
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <span key={service} className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                {service}
              </span>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function ServiceCard({
  name,
  description,
  icon,
  href,
  enabled,
  stats,
}: {
  name: string
  description: string
  icon: React.ReactNode
  href: string
  enabled: boolean
  stats: React.ReactNode
}) {
  if (!enabled) {
    return (
      <Card className="bg-card border-border opacity-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3">
            {icon}
            <span className="font-medium text-card-foreground">{name}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <p className="text-xs text-muted-foreground">Connect account to access</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Link href={href}>
      <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3">
            {icon}
            <span className="font-medium text-card-foreground">{name}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          {stats}
        </CardContent>
      </Card>
    </Link>
  )
}

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: string | number
  label: string
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-sm">
        {value} {label}
      </span>
    </div>
  )
}
