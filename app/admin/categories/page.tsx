"use client"

import { useState, useEffect } from "react"
import { CategoriesManager } from "@/components/admin/categories-manager"
import { useI18n } from "@/lib/i18n/i18n-context"
import { toast } from "sonner"

export default function AdminCategoriesPage() {
  const { t } = useI18n()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/categories")
        const json = await res.json()
        if (res.ok) {
          setCategories(json.data)
        } else {
          toast.error(json.error || "Erreur")
        }
      } catch {
        toast.error("Erreur de connexion")
      }
      setIsLoading(false)
    }
    fetchCategories()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.categoriesTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("admin.categoriesSubtitle")}</p>
      </div>

      <CategoriesManager initialCategories={categories} />
    </div>
  )
}
