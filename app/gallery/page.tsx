import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { GalleryContent } from "@/components/gallery/gallery-content"
import { GallerySkeleton } from "@/components/gallery/gallery-skeleton"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@/lib/auth"
import type { Frame, Category } from "@/lib/types"

export const metadata = {
  title: "Frame Gallery",
  description: "Browse hundreds of beautiful frame templates for every occasion.",
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const categoryParam = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : null
  const searchParam = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : ""
  const pageParam = typeof resolvedSearchParams.page === 'string' ? resolvedSearchParams.page : "1"
  const sortBy = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : "popular"
  const currentPage = parseInt(pageParam) || 1
  const ITEMS_PER_PAGE = 12
  
  const supabase = await createClient()
  const session = await auth()

  // 1. Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  // 2. Fetch frames
  let query = supabase
    .from("frames")
    .select(`
      *,
      category:categories(*)
    `, { count: "exact" })
    .eq("is_active", true)

  if (categoryParam && categories) {
    const category = categories.find(
      (c) => c.slug === categoryParam || c.name.toLowerCase() === categoryParam.toLowerCase()
    )
    if (category) {
      query = query.eq("category_id", category.id)
    }
  }

  if (searchParam) {
    query = query.or(`name.ilike.%${searchParam}%,description.ilike.%${searchParam}%`)
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

  const { data: framesData, count } = await query.range(from, to)

  let frames: Frame[] = (framesData as Frame[]) || []
  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Fetch likes if user is logged in
  if (session?.user?.id && frames.length > 0) {
    const { data: likes } = await supabase
      .from("frame_likes")
      .select("frame_id")
      .eq("user_id", session.user.id)
      .in("frame_id", frames.map(f => f.id))
    
    if (likes) {
      const likedFrameIds = new Set(likes.map(l => l.frame_id))
      frames = frames.map(frame => ({
        ...frame,
        is_liked: likedFrameIds.has(frame.id)
      }))
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<GallerySkeleton />}>
          <GalleryContent 
            frames={frames}
            categories={(categories as Category[]) || []}
            totalCount={totalCount}
            totalPages={totalPages}
            currentPage={currentPage}
            categoryParam={categoryParam}
            searchParam={searchParam}
            sortByParam={sortBy}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
