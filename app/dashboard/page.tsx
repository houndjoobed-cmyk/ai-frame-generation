import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const session = await auth()
  const supabase = createAdminClient()

  // Fetch user stats
  const [projectsRes, likesRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact" })
      .eq("user_id", session?.user?.id || ""),
    supabase
      .from("frame_likes")
      .select("id", { count: "exact" })
      .eq("user_id", session?.user?.id || ""),
  ])

  const projectCount = projectsRes.count || 0
  const likesCount = likesRes.count || 0

  // Fetch recent projects
  const { data: recentProjects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", session?.user?.id || "")
    .order("updated_at", { ascending: false })
    .limit(4)

  const userName = session?.user?.name?.split(" ")[0] || "Creator"

  return (
    <DashboardContent
      userName={userName}
      projectCount={projectCount}
      likesCount={likesCount}
      recentProjects={recentProjects || []}
    />
  )
}
