"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FrameCard } from "@/components/gallery/frame-card"
import type { Frame, Category } from "@/lib/types"
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/i18n-context"

interface GalleryContentProps {
  frames: Frame[]
  categories: Category[]
  totalCount: number
  totalPages: number
  currentPage: number
  categoryParam: string | null
  searchParam: string
  sortByParam: string
}

export function GalleryContent({
  frames,
  categories,
  totalCount,
  totalPages,
  currentPage,
  categoryParam,
  searchParam,
  sortByParam
}: GalleryContentProps) {
  const router = useRouter()
  const { t } = useI18n()
  
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState(searchParam)

  function updateParams(newParams: Record<string, string | null>) {
    startTransition(() => {
      const url = new URL(window.location.href)
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
          url.searchParams.delete(key)
        } else {
          url.searchParams.set(key, value)
        }
      })
      router.push(url.pathname + url.search)
    })
  }

  function handleCategorySelect(slug: string | null) {
    updateParams({ category: slug, page: null })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ search: searchQuery || null, page: null })
  }

  function handlePageChange(newPage: number) {
    updateParams({ page: newPage.toString() })
  }

  const ITEMS_PER_PAGE = 12

  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("gallery.title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("gallery.subtitle")}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("gallery.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                {t("gallery.searchBtn")}
              </Button>
            </form>
            <Select value={sortByParam} onValueChange={(v) => updateParams({ sort: v })}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t("gallery.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">{t("gallery.sort.popular")}</SelectItem>
                <SelectItem value="newest">{t("gallery.sort.newest")}</SelectItem>
                <SelectItem value="name">{t("gallery.sort.name")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryParam === null ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategorySelect(null)}
            >
              {t("gallery.all")}
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={categoryParam === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategorySelect(category.slug)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Active Filters */}
          {(categoryParam || searchParam) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("gallery.activeFilters")}</span>
              {categoryParam && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find((c) => c.slug === categoryParam)?.name || categoryParam}
                  <button onClick={() => handleCategorySelect(null)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchParam && (
                <Badge variant="secondary" className="gap-1">
                  &quot;{searchParam}&quot;
                  <button onClick={() => {
                    setSearchQuery("")
                    updateParams({ search: null })
                  }}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {isPending ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : frames.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("gallery.noFrames")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("gallery.noFramesDesc")}
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("")
              handleCategorySelect(null)
            }}>
              {t("gallery.clearFilters")}
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {t("gallery.showing")} {Math.min(totalCount, (currentPage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(totalCount, currentPage * ITEMS_PER_PAGE)} {t("gallery.of") || "sur"} {totalCount} {t("gallery.framesCount")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {frames.map((frame) => (
                <FrameCard key={frame.id} frame={frame} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Page number buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
                    return (
                      <Button
                        key={p}
                        variant={p === currentPage ? "default" : "outline"}
                        onClick={() => handlePageChange(p)}
                        className="w-10 h-10 cursor-pointer"
                      >
                        {p}
                      </Button>
                    )
                  }
                  if (p === 2 || p === totalPages - 1) {
                    return <span key={p} className="px-2 text-muted-foreground">...</span>
                  }
                  return null
                })}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

