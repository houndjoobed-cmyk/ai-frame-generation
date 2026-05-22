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
        thumbnail_url,
        image_url,
        category:categories(name)
      )
    `)
    .eq("user_id", session?.user?.id || "")
    .order("created_at", { ascending: false })

  return <LikedContent likedFrames={likedFrames || []} />
}
