"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Bell, Check, CheckCheck, Info, AlertTriangle, Zap, CreditCard, Settings2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

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

const typeIcons: Record<string, typeof Info> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: AlertTriangle,
  system: Settings2,
}

const categoryIcons: Record<string, typeof Info> = {
  ai: Zap,
  subscription: CreditCard,
  export: Check,
  general: Info,
  system: Settings2,
}

export function NotificationBell() {
  const { data: session } = useSession()
  const { t } = useI18n()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=5&unread=false")
      const json = await res.json()
      if (res.ok) {
        setNotifications(json.data)
        setUnreadCount(json.meta.unreadCount)
      }
    } catch {
      // Silently fail — non-critical
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    if (!session?.user?.id) return

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications-user-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as Notification
            setNotifications((prev) => [newNotif, ...prev.slice(0, 4)])
            setUnreadCount((prev) => prev + 1)
            
            // Trigger dynamic rich toast notification
            toast(newNotif.title, {
              description: newNotif.message,
              action: newNotif.action_url ? {
                label: "Voir",
                onClick: () => {
                  window.location.href = newNotif.action_url!
                }
              } : undefined
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedNotif = payload.new as Notification
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
            )
            fetchNotifications()
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
            fetchNotifications()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, fetchNotifications])

  async function handleMarkAllRead() {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      if (res.ok) {
        setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch {
      // Silently fail
    }
  }

  async function handleMarkOneRead(notificationId: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })
      setNotifications(
        notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch {
      // Silently fail
    }
  }

  function getRelativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return t("notifications.justNow")
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}j`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0 text-muted-foreground hover:text-foreground relative cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="text-sm font-semibold">{t("notifications.title")}</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">{t("notifications.empty")}</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const IconComponent = categoryIcons[notif.category] || typeIcons[notif.type] || Info
              return (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-3 p-3 border-b last:border-b-0 transition-colors cursor-pointer hover:bg-muted/50",
                    !notif.is_read && "bg-primary/5"
                  )}
                  onClick={() => !notif.is_read && handleMarkOneRead(notif.id)}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      notif.type === "success" && "bg-emerald-500/10 text-emerald-500",
                      notif.type === "warning" && "bg-amber-500/10 text-amber-500",
                      notif.type === "error" && "bg-destructive/10 text-destructive",
                      notif.type === "info" && "bg-blue-500/10 text-blue-500",
                      notif.type === "system" && "bg-violet-500/10 text-violet-500"
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{notif.title}</p>
                      {!notif.is_read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {getRelativeTime(notif.created_at)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t">
          <Link href="/dashboard/notifications">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setIsOpen(false)}
            >
              {t("notifications.viewAll")}
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
