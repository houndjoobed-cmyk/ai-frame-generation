"use client"

import { useState, useEffect } from "react"
import { UsersTable } from "@/components/admin/users-table"
import { useI18n } from "@/lib/i18n/i18n-context"
import { toast } from "sonner"

export default function AdminUsersPage() {
  const { t } = useI18n()
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users?page=1&limit=20")
        const json = await res.json()
        if (res.ok) {
          setUsers(json.data)
          setMeta(json.meta)
        } else {
          toast.error(json.error || "Erreur")
        }
      } catch {
        toast.error("Erreur de connexion")
      }
      setIsLoading(false)
    }
    fetchUsers()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-10 w-72 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.usersTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("admin.usersSubtitle")}</p>
      </div>

      <UsersTable initialUsers={users} initialMeta={meta} />
    </div>
  )
}
