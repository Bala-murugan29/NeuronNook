"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { GmailIcon, DriveIcon, PhotosIcon, OneDriveIcon, GoogleIcon, MicrosoftIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, LinkIcon, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const googleServices = [
  { name: "Gmail", href: "/dashboard/gmail", icon: GmailIcon, provider: "google" },
  { name: "Drive", href: "/dashboard/drive", icon: DriveIcon, provider: "google" },
  { name: "Photos", href: "/dashboard/photos", icon: PhotosIcon, provider: "google" },
]

const microsoftServices = [{ name: "OneDrive", href: "/dashboard/onedrive", icon: OneDriveIcon, provider: "microsoft" }]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, linkAccount } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="h-16 border-b border-sidebar-border flex items-center px-4 gap-2">
          <img src="/logowithouttext.png" alt="NeuronNook" className="h-8 w-8 shrink-0" />
          {!collapsed && <span className="text-lg font-semibold text-sidebar-foreground">NeuronNook</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          {/* Overview */}
          <div>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Overview</h3>
            )}
            <NavLink
              href="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              active={pathname === "/dashboard"}
              collapsed={collapsed}
            />
          </div>

          {/* Google Services */}
          <div>
            {!collapsed && (
              <div className="flex items-center justify-between px-3 mb-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Google</h3>
                {!user?.googleConnected && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => linkAccount("google")}>
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Link
                  </Button>
                )}
              </div>
            )}
            {googleServices.map((service) => (
              <NavLink
                key={service.href}
                href={service.href}
                icon={service.icon}
                label={service.name}
                active={pathname === service.href}
                disabled={!user?.googleConnected}
                collapsed={collapsed}
              />
            ))}
          </div>

          {/* Microsoft Services */}
          <div>
            {!collapsed && (
              <div className="flex items-center justify-between px-3 mb-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Microsoft</h3>
                {!user?.microsoftConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => linkAccount("microsoft")}
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Link
                  </Button>
                )}
              </div>
            )}
            {microsoftServices.map((service) => (
              <NavLink
                key={service.href}
                href={service.href}
                icon={service.icon}
                label={service.name}
                active={pathname === service.href}
                disabled={!user?.microsoftConnected}
                collapsed={collapsed}
              />
            ))}
          </div>
        </nav>

        {/* Connection Status */}
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="space-y-2">
              <ConnectionStatus
                provider="Google"
                connected={user?.googleConnected || false}
                icon={<GoogleIcon className="h-4 w-4" />}
                onConnect={() => linkAccount("google")}
              />
              <ConnectionStatus
                provider="Microsoft"
                connected={user?.microsoftConnected || false}
                icon={<MicrosoftIcon className="h-4 w-4" />}
                onConnect={() => linkAccount("microsoft")}
              />
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  disabled,
  collapsed,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  disabled?: boolean
  collapsed: boolean
}) {
  const content = (
    <Link
      href={disabled ? "#" : href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
          {disabled && <p className="text-xs text-muted-foreground">Not connected</p>}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

function ConnectionStatus({
  provider,
  connected,
  icon,
  onConnect,
}: {
  provider: string
  connected: boolean
  icon: React.ReactNode
  onConnect: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-sidebar-foreground">{provider}</span>
      </div>
      {connected ? (
        <span className="text-xs text-green-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Connected
        </span>
      ) : (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onConnect}>
          Connect
        </Button>
      )}
    </div>
  )
}
