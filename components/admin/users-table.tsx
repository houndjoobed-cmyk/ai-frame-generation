"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, ChevronLeft, ChevronRight, User } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/i18n-context"

interface AdminUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  displayName: string | null
  createdAt: string | null
  plan: string
  planSlug: string
}

interface UsersTableProps {
  initialUsers: AdminUser[]
  initialMeta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function UsersTable({ initialUsers, initialMeta }: UsersTableProps) {
  const { t } = useI18n()
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [meta, setMeta] = useState(initialMeta)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function fetchUsers(page: number, searchQuery?: string) {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })
      if (searchQuery) params.set("search", searchQuery)

      const res = await fetch(`/api/admin/users?${params}`)
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

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })
      const json = await res.json()

      if (res.ok) {
        toast.success(json.message)
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
      } else {
        toast.error(json.error || "Erreur")
      }
    } catch {
      toast.error("Erreur de connexion")
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchUsers(1, search)
  }

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive"
      case "admin":
        return "default"
      case "creator":
        return "secondary"
      default:
        return "outline"
    }
  }

  const planBadgeColor = (slug: string) => {
    switch (slug) {
      case "business":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30"
      case "pro":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.searchUsers")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={isLoading}>
          {t("gallery.searchBtn")}
        </Button>
      </form>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t("admin.table.user")}</TableHead>
              <TableHead>{t("admin.table.email")}</TableHead>
              <TableHead>{t("admin.table.role")}</TableHead>
              <TableHead>{t("admin.table.plan")}</TableHead>
              <TableHead>{t("admin.table.joined")}</TableHead>
              <TableHead className="text-right">{t("admin.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("admin.noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback>
                          {user.name?.charAt(0).toUpperCase() || <User className="h-3 w-3" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {user.displayName || user.name || "Sans nom"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(user.role) as any} className="text-xs capitalize">
                      {user.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${planBadgeColor(user.planSlug)}`}>
                      {user.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("admin.showing")} {(meta.page - 1) * meta.limit + 1}-
            {Math.min(meta.page * meta.limit, meta.total)} {t("gallery.of") || "sur"} {meta.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchUsers(meta.page - 1, search)}
              disabled={meta.page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchUsers(meta.page + 1, search)}
              disabled={meta.page === meta.totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
