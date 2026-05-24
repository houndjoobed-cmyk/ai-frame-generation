"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FrameCard } from "@/components/gallery/frame-card"
import { createClient } from "@/lib/supabase/client"
import type { Frame, Category } from "@/lib/types"
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/i18n-context"
import { useSession } from "next-auth/react"

export function GalleryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")
  const searchParam = searchParams.get("search")
  const { t } = useI18n()
  const { data: session } = useSession()

  const [frames, setFrames] = useState<Frame[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam)
  const [searchQuery, setSearchQuery] = useState(searchParam || "")
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "name">("popular")
  const [isLoading, setIsLoading] = useState(true)
  
  const pageParam = searchParams.get("page")
  const currentPage = pageParam ? parseInt(pageParam) : 1
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const ITEMS_PER_PAGE = 12

  const supabase = createClient()

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name")
      
      if (data) {
        setCategories(data)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    async function fetchFrames() {
      setIsLoading(true)
      
      let query = supabase
        .from("frames")
        .select(`
          *,
          category:categories(*)
        `, { count: "exact" })
        .eq("is_active", true)

      if (selectedCategory) {
        const category = categories.find(
          (c) => c.slug === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase()
        )
        if (category) {
          query = query.eq("category_id", category.id)
        }
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      switch (sortBy) {
        case "popular":
          query = query.order("download_count", { ascending: false })
          break
        case "newest":
          query = query.order("created_at", { ascending: false })
          break
        case "name":
          query = query.order("name")
          break
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, error, count } = await query.range(from, to)

      if (data && !error) {
        let likedFrameIds = new Set<string>()
        if (session?.user?.id && data.length > 0) {
          const { data: likes } = await supabase
            .from("frame_likes")
            .select("frame_id")
            .eq("user_id", session.user.id)
            .in("frame_id", data.map((f: any) => f.id))
          
          if (likes) {
            likedFrameIds = new Set(likes.map((l: any) => l.frame_id))
          }
        }

        const mapped = data.map((frame: any) => ({
          ...frame,
          is_liked: likedFrameIds.has(frame.id)
        }))

        setFrames(mapped as Frame[])
        setTotalCount(count || 0)
        setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE))
      }
      
      setIsLoading(false)
    }

    fetchFrames()
  }, [selectedCategory, searchQuery, sortBy, categories, currentPage, session?.user?.id])

  function handleCategorySelect(slug: string | null) {
    setSelectedCategory(slug)
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set("category", slug)
    } else {
      params.delete("category")
    }
    params.delete("page")
    router.push(`/gallery?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery) {
      params.set("search", searchQuery)
    } else {
      params.delete("search")
    }
    params.delete("page")
    router.push(`/gallery?${params.toString()}`)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`/gallery?${params.toString()}`)
  }

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
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
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
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategorySelect(null)}
            >
              {t("gallery.all")}
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategorySelect(category.slug)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Active Filters */}
          {(selectedCategory || searchParam) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("gallery.activeFilters")}</span>
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
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
                    const params = new URLSearchParams(searchParams.toString())
                    params.delete("search")
                    router.push(`/gallery?${params.toString()}`)
                  }}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
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

