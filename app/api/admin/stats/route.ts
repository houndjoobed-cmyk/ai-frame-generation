import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single()
  return profile?.role === "admin" || profile?.role === "super_admin"
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Fetch all stats in parallel
    const [
      usersResult,
      framesResult,
      projectsResult,
      exportsResult,
      activeSubsResult,
      revenueResult,
      planDistributionResult,
    ] = await Promise.all([
      // Total users
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      // Total frames
      supabase.from("frames").select("*", { count: "exact", head: true }),
      // Total projects
      supabase.from("projects").select("*", { count: "exact", head: true }),
      // Total exports
      supabase.from("exports").select("*", { count: "exact", head: true }),
      // Active subscriptions
      supabase.from("user_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
      // Monthly revenue (current month)
      supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      // Subscription plan distribution
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

    // Calculate monthly revenue
    const monthlyRevenue = (revenueResult.data || []).reduce(
      (sum: number, p: { amount: number | null }) => sum + (p.amount || 0),
      0
    )

    // Plan distribution
    const planDistribution: Record<string, number> = {}
    for (const sub of planDistributionResult.data || []) {
      const planArray = sub.plan
      const plan = Array.isArray(planArray)
        ? planArray[0]
        : (planArray as { name: string; slug: string } | null)
      const planName = plan?.name || "Inconnu"
      planDistribution[planName] = (planDistribution[planName] || 0) + 1
    }

    // Recent signups (last 7 days) - fetch from profiles table which has created_at
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentProfiles } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true })

    // Group by date
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

    return NextResponse.json({
      data: {
        totalUsers,
        totalFrames,
        totalProjects,
        totalExports,
        activeSubscriptions,
        monthlyRevenue,
        planDistribution,
        signupsChart,
      },
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
