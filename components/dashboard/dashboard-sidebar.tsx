"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FolderOpen, Heart, Settings, Plus, Frame, Bell, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/i18n-context"
import { useSession } from "next-auth/react"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role

  const navigation = [
    { name: t("header.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("dashboard.myProjects"), href: "/dashboard/projects", icon: FolderOpen },
    { name: t("dashboard.myFrames"), href: "/dashboard/frames", icon: Frame },
    { name: t("dashboard.createFrame"), href: "/dashboard/frames/create", icon: Plus },
    { name: t("dashboard.likedFrames"), href: "/dashboard/liked", icon: Heart },
    { name: t("notifications.title"), href: "/dashboard/notifications", icon: Bell },
    { name: t("header.settings"), href: "/dashboard/settings", icon: Settings },
  ]

  return (
    <aside className="w-64 border-r bg-muted/30 hidden md:flex flex-col">
      <div className="p-4">
        <Link href="/editor">
          <Button className="w-full gap-2">
            <Plus className="w-4 h-4" />
            {t("dashboard.newProject")}
          </Button>
        </Link>
      </div>
      <nav className="flex-1 px-2 pb-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          )
        })}

        {/* Admin link — only for admin/super_admin */}
        {(userRole === "admin" || userRole === "super_admin") && (
          <>
            <div className="border-t my-2" />
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              <Shield className="w-4 h-4" />
              {t("admin.title")}
            </Link>
          </>
        )}
      </nav>
    </aside>
  )
}


