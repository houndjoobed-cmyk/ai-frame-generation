import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { FramesContent } from "@/components/dashboard/frames-content"

export const metadata = {
  title: "Mes Frames",
  description: "Gérez vos templates de cadres photo personnalisés.",
}

export default async function FramesPage() {
  const session = await auth()
  const supabase = createAdminClient()

  const { data: frames } = await supabase
    .from("frames")
    .select("*, category:categories(*)")
    .eq("created_by", session?.user?.id || "")
    .order("created_at", { ascending: false })

  return <FramesContent frames={frames || []} />
}
