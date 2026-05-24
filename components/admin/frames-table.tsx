"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Eye, EyeOff, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/i18n-context"

interface AdminFrame {
  id: string
  name: string
  image_url: string
  thumbnail_url: string | null
  is_active: boolean
  is_premium: boolean
  like_count: number
  download_count: number
  created_at: string
  category: { name: string; slug: string } | null
}

interface FramesTableProps {
  initialFrames: AdminFrame[]
  initialMeta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  categories: { id: string; name: string }[]
}

export function FramesTable({ initialFrames, initialMeta, categories }: FramesTableProps) {
  const { t } = useI18n()
  const [frames, setFrames] = useState<AdminFrame[]>(initialFrames)
  const [meta, setMeta] = useState(initialMeta)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function fetchFrames(page: number) {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (categoryFilter) params.set("category", categoryFilter)
      if (statusFilter) params.set("status", statusFilter)

      const res = await fetch(`/api/admin/frames?${params}`)
      const json = await res.json()

      if (res.ok) {
        setFrames(json.data)
        setMeta(json.meta)
      } else {
        toast.error(json.error || "Erreur")
      }
    } catch {
      toast.error("Erreur de connexion")
    }
    setIsLoading(false)
  }

  async function handleToggleActive(frameId: string, currentActive: boolean) {
    try {
      const res = await fetch("/api/admin/frames", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameId, is_active: !currentActive }),
      })

      if (res.ok) {
        toast.success(currentActive ? t("admin.frameDisabled") : t("admin.frameEnabled"))
        setFrames(frames.map((f) =>
          f.id === frameId ? { ...f, is_active: !currentActive } : f
        ))
      } else {
        const json = await res.json()
        toast.error(json.error || "Erreur")
      }
    } catch {
      toast.error("Erreur de connexion")
    }
  }

  async function handleDelete(frameId: string) {
    try {
      const res = await fetch(`/api/admin/frames?id=${frameId}`, { method: "DELETE" })

      if (res.ok) {
        toast.success(t("admin.frameDeleted"))
        setFrames(frames.filter((f) => f.id !== frameId))
      } else {
        const json = await res.json()
        toast.error(json.error || "Erreur")
      }
    } catch {
      toast.error("Erreur de connexion")
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v); setTimeout(() => fetchFrames(1), 0) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("admin.filterCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("gallery.all")}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setTimeout(() => fetchFrames(1), 0) }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t("admin.filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("gallery.all")}</SelectItem>
            <SelectItem value="active">{t("admin.active")}</SelectItem>
            <SelectItem value="inactive">{t("admin.inactive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t("admin.table.preview")}</TableHead>
              <TableHead>{t("admin.table.name")}</TableHead>
              <TableHead>{t("admin.table.category")}</TableHead>
              <TableHead>{t("admin.table.status")}</TableHead>
              <TableHead className="text-center">❤️</TableHead>
              <TableHead className="text-center">📥</TableHead>
              <TableHead className="text-right">{t("admin.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <div className="h-12 bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : frames.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("admin.noFrames")}
                </TableCell>
              </TableRow>
            ) : (
              frames.map((frame) => (
                <TableRow key={frame.id} className="group">
                  <TableCell>
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={frame.thumbnail_url || frame.image_url}
                        alt={frame.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{frame.name}</span>
                      {frame.is_premium && (
                        <Badge variant="secondary" className="w-fit text-[10px] mt-0.5">Premium</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {frame.category?.name || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={frame.is_active ? "default" : "outline"}
                      className={`text-xs ${frame.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "text-muted-foreground"}`}
                    >
                      {frame.is_active ? t("admin.active") : t("admin.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">{frame.like_count}</TableCell>
                  <TableCell className="text-center text-sm">{frame.download_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleActive(frame.id, frame.is_active)}
                        title={frame.is_active ? t("admin.disable") : t("admin.enable")}
                      >
                        {frame.is_active ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-emerald-500" />
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("admin.confirmDelete")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("admin.confirmDeleteDesc")} &quot;{frame.name}&quot;
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("settings.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(frame.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t("admin.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
            Page {meta.page} / {meta.totalPages} ({meta.total} frames)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchFrames(meta.page - 1)}
              disabled={meta.page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchFrames(meta.page + 1)}
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
