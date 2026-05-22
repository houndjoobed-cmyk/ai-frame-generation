import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { ProjectsContent } from "@/components/dashboard/projects-content"

export const metadata = {
  title: "My Projects",
  description: "View and manage your saved projects.",
}

export default async function ProjectsPage() {
  const session = await auth()
  const supabase = createAdminClient()

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", session?.user?.id || "")
    .order("updated_at", { ascending: false })

  return <ProjectsContent projects={projects || []} />
}
