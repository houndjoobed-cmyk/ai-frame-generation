import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client"

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single()
  return profile?.role === "admin" || profile?.role === "super_admin"
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const userIsAdmin = await isAdmin(session.user.id)
  if (!userIsAdmin) {
    redirect("/dashboard")
  }

  const supabase = createAdminClient()

  const [
    usersResult,
    framesResult,
    projectsResult,
    exportsResult,
    activeSubsResult,
    revenueResult,
    planDistributionResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("frames").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("exports").select("*", { count: "exact", head: true }),
    supabase.from("user_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "completed")
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase
      .from("user_subscriptions")
      .select("plan_id, status, plan:subscription_plans(name, slug)")
      .eq("status", "active"),
  ])

  const totalUsers = usersResult.count || 0
  const totalFrames = framesResult.count || 0
  const totalProjects = projectsResult.count || 0
  const totalExports = exportsResult.count || 0
  const activeSubscriptions = activeSubsResult.count || 0

  const monthlyRevenue = (revenueResult.data || []).reduce(
    (sum: number, p: any) => sum + (p.amount || 0),
    0
  )

  const planDistribution: Record<string, number> = {}
  for (const sub of planDistributionResult.data || []) {
    const planName = (sub.plan as any)?.name || "Inconnu"
    planDistribution[planName] = (planDistribution[planName] || 0) + 1
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentProfiles } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: true })

  const signupsPerDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split("T")[0]
    signupsPerDay[key] = 0
  }
  for (const profile of recentProfiles || []) {
    const key = profile.created_at.split("T")[0]
    if (signupsPerDay[key] !== undefined) {
      signupsPerDay[key]++
    }
  }

  const signupsChart = Object.entries(signupsPerDay).map(([date, count]) => ({
    date,
    count,
  }))

  const stats = {
    totalUsers,
    totalFrames,
    totalProjects,
    totalExports,
    activeSubscriptions,
    monthlyRevenue,
    planDistribution,
    signupsChart,
  }

  return <AdminDashboardClient stats={stats} />
}
