"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  Zap,
  CreditCard,
  Settings2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  category: string
  is_read: boolean
  action_url: string | null
  created_at: string
}

const categoryOptions = [
  { value: "all", label: "Toutes" },
  { value: "general", label: "Général" },
  { value: "export", label: "Export" },
  { value: "ai", label: "IA" },
  { value: "subscription", label: "Abonnement" },
  { value: "system", label: "Système" },
]

const typeColors: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-500",
  warning: "bg-amber-500/10 text-amber-500",
  error: "bg-destructive/10 text-destructive",
  info: "bg-blue-500/10 text-blue-500",
  system: "bg-violet-500/10 text-violet-500",
}

const categoryIcons: Record<string, typeof Info> = {
  ai: Zap,
  subscription: CreditCard,
  export: Check,
  general: Info,
  system: Settings2,
}

export default function NotificationsPage() {
  const { t } = useI18n()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1, unreadCount: 0 })
  const [categoryFilter, setCategoryFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  async function fetchNotifications(page: number, category?: string) {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (category) params.set("category", category)

      const res = await fetch(`/api/notifications?${params}`)
      const json = await res.json()

      if (res.ok) {
        setNotifications(json.data)
        setMeta(json.meta)
      } else {
        toast.error(json.error || "Erreur")
      }
    } catch {
      toast.error("Erreur de connexion")
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchNotifications(1)
  }, [])

  async function handleMarkAllRead() {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      if (res.ok) {
        setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
        setMeta({ ...meta, unreadCount: 0 })
        toast.success(t("notifications.allMarkedRead"))
      }
    } catch {
      toast.error("Erreur")
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      })
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      setMeta({ ...meta, unreadCount: Math.max(0, meta.unreadCount - 1) })
    } catch {
      toast.error("Erreur")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setNotifications(notifications.filter((n) => n.id !== id))
        toast.success(t("notifications.deleted"))
      }
    } catch {
      toast.error("Erreur")
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("notifications.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {meta.unreadCount > 0
              ? `${meta.unreadCount} ${t("notifications.unread")}`
              : t("notifications.allRead")}
          </p>
        </div>
        {meta.unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4" />
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={categoryFilter || "all"}
          onValueChange={(v) => {
            const cat = v === "all" ? "" : v
            setCategoryFilter(cat)
            fetchNotifications(1, cat)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("notifications.filterCategory")} />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">{t("notifications.empty")}</p>
            <p className="text-sm mt-1">{t("notifications.emptyDesc")}</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const IconComponent = categoryIcons[notif.category] || Info
            return (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-sm group",
                  !notif.is_read ? "bg-primary/5 border-primary/20" : "bg-card"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", typeColors[notif.type] || typeColors.info)}>
                  <IconComponent className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">{notif.title}</h4>
                    {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary" />}
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {notif.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {new Date(notif.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMarkRead(notif.id)}
                      title={t("notifications.markRead")}
                    >
                      <Check className="h-4 w-4 text-emerald-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(notif.id)}
                    title={t("notifications.delete")}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} / {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchNotifications(meta.page - 1, categoryFilter)}
              disabled={meta.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchNotifications(meta.page + 1, categoryFilter)}
              disabled={meta.page === meta.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
