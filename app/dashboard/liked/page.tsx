import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { LikedContent } from "@/components/dashboard/liked-content"

export const metadata = {
  title: "Liked Frames",
  description: "View your liked frame templates.",
}

export default async function LikedPage() {
  const session = await auth()
  const supabase = createAdminClient()

  const { data: likedFrames } = await supabase
    .from("frame_likes")
    .select(`
      id,
      created_at,
      frame:frames(
        id,
        name,
        description,
        thumbnail_url,
        image_url,
        like_count,
        download_count,
        is_premium,
        category:categories(id, name)
      )
    `)
    .eq("user_id", session?.user?.id || "")
    .order("created_at", { ascending: false })

  const typedLikedFrames = (likedFrames || []).map((lf: any) => {
    const rawFrame = lf.frame
    const frameObj = Array.isArray(rawFrame) ? rawFrame[0] : rawFrame
    let categoryObj = null
    if (frameObj?.category) {
      const catArray = frameObj.category
      const singleCat = Array.isArray(catArray) ? catArray[0] : catArray
      if (singleCat) {
        categoryObj = {
          id: singleCat.id,
          name: singleCat.name,
          slug: singleCat.slug || "",
          description: singleCat.description || null,
          icon: singleCat.icon || null,
          color: singleCat.color || null,
          sort_order: singleCat.sort_order || 0,
          is_active: singleCat.is_active || true,
          created_at: singleCat.created_at || new Date().toISOString(),
        }
      }
    }

    return {
      id: lf.id,
      frame: frameObj ? {
        id: frameObj.id,
        name: frameObj.name,
        description: frameObj.description,
        image_url: frameObj.image_url,
        thumbnail_url: frameObj.thumbnail_url,
        like_count: frameObj.like_count || 0,
        download_count: frameObj.download_count || 0,
        is_premium: frameObj.is_premium || false,
        category: categoryObj,
        tags: frameObj.tags || [],
        is_public: frameObj.is_public || true,
        is_active: frameObj.is_active || true,
        created_by: frameObj.created_by || null,
        width: frameObj.width || null,
        height: frameObj.height || null,
        file_size: frameObj.file_size || null,
        file_format: frameObj.file_format || null,
        created_at: frameObj.created_at || new Date().toISOString(),
        updated_at: frameObj.updated_at || new Date().toISOString(),
      } : null
    }
  })

  return <LikedContent likedFrames={typedLikedFrames as any} />
}
