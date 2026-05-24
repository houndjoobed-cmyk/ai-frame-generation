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

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""

    const supabase = createAdminClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Fetch users from next_auth.users joined with profiles
    let query = supabase
      .schema("next_auth")
      .from("users")
      .select("*", { count: "exact" })
      .order("id")
      .range(from, to)

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, count, error } = await query

    if (error) {
      console.error("Admin users fetch error:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    // Fetch profiles for these users to get roles
    const userIds = (users || []).map((u: any) => u.id)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, role, display_name, created_at")
      .in("user_id", userIds)

    // Fetch active subscriptions
    const { data: subscriptions } = await supabase
      .from("user_subscriptions")
      .select("user_id, plan:subscription_plans(name, slug)")
      .eq("status", "active")
      .in("user_id", userIds)

    // Merge data
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]))
    const subMap = new Map((subscriptions || []).map((s: any) => [s.user_id, s]))

    const enrichedUsers = (users || []).map((u: any) => {
      const profile = profileMap.get(u.id)
      const sub = subMap.get(u.id)
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        emailVerified: u.emailVerified,
        role: profile?.role || "user",
        displayName: profile?.display_name,
        createdAt: profile?.created_at,
        plan: (sub?.plan as any)?.name || "Gratuit",
        planSlug: (sub?.plan as any)?.slug || "free",
      }
    })

    return NextResponse.json({
      data: enrichedUsers,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const { userId, role } = await req.json()

    if (!userId || !role) {
      return NextResponse.json({ error: "userId et role sont requis" }, { status: 400 })
    }

    const validRoles = ["user", "creator", "admin", "super_admin"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
    }

    // Only super_admin can promote to admin/super_admin
    const supabase = createAdminClient()
    if (role === "admin" || role === "super_admin") {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .single()

      if (currentProfile?.role !== "super_admin") {
        return NextResponse.json({ error: "Seul un super_admin peut promouvoir au rôle admin" }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("user_id", userId)

    if (error) {
      console.error("Admin role update error:", error)
      return NextResponse.json({ error: "Erreur lors de la mise à jour du rôle" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Rôle mis à jour vers ${role}` })
  } catch (error) {
    console.error("Admin users PATCH error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
