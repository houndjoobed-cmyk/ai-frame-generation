"use client"

import { useState, useEffect } from "react"
import { FramesTable } from "@/components/admin/frames-table"
import { useI18n } from "@/lib/i18n/i18n-context"
import { toast } from "sonner"

export default function AdminFramesPage() {
  const { t } = useI18n()
  const [frames, setFrames] = useState([])
  const [categories, setCategories] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [framesRes, catsRes] = await Promise.all([
          fetch("/api/admin/frames?page=1&limit=20"),
          fetch("/api/admin/categories"),
        ])
        const framesJson = await framesRes.json()
        const catsJson = await catsRes.json()

        if (framesRes.ok) {
          setFrames(framesJson.data)
          setMeta(framesJson.meta)
        }
        if (catsRes.ok) {
          setCategories(catsJson.data.map((c: any) => ({ id: c.id, name: c.name })))
        }
      } catch {
        toast.error("Erreur de connexion")
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="flex gap-3">
          <div className="h-10 w-44 bg-muted animate-pulse rounded" />
          <div className="h-10 w-36 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.framesTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("admin.framesSubtitle")}</p>
      </div>

      <FramesTable initialFrames={frames} initialMeta={meta} categories={categories} />
    </div>
  )
}
