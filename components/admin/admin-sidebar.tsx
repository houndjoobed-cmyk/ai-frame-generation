"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Image,
  FolderTree,
  ArrowLeft,
  Shield,
  Paintbrush,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

export function AdminSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()

  const navigation = [
    { name: t("admin.dashboard"), href: "/admin", icon: LayoutDashboard },
    { name: t("admin.users"), href: "/admin/users", icon: Users },
    { name: t("admin.frames"), href: "/admin/frames", icon: Image },
    { name: t("admin.categories"), href: "/admin/categories", icon: FolderTree },
    { name: t("admin.customOrders"), href: "/admin/custom-orders", icon: Paintbrush },
  ]

  return (
    <aside className="w-64 border-r bg-muted/30 hidden md:flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-destructive" />
          </div>
          <span className="text-sm font-bold tracking-tight">{t("admin.title")}</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          {t("admin.backToDashboard")}
        </Link>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navigation.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-destructive text-destructive-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
