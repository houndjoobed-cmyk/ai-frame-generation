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
    const category = searchParams.get("category") || ""
    const status = searchParams.get("status") || ""

    const supabase = createAdminClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from("frames")
      .select("*, category:categories(name, slug)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (category) {
      query = query.eq("category_id", category)
    }

    if (status === "active") {
      query = query.eq("is_active", true)
    } else if (status === "inactive") {
      query = query.eq("is_active", false)
    }

    const { data: frames, count, error } = await query

    if (error) {
      console.error("Admin frames fetch error:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    return NextResponse.json({
      data: frames || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Admin frames error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const { frameId, is_active } = await req.json()

    if (!frameId || typeof is_active !== "boolean") {
      return NextResponse.json({ error: "frameId et is_active sont requis" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("frames")
      .update({ is_active })
      .eq("id", frameId)

    if (error) {
      console.error("Admin frame update error:", error)
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin frames PATCH error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const frameId = searchParams.get("id")

    if (!frameId) {
      return NextResponse.json({ error: "Frame ID requis" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("frames")
      .delete()
      .eq("id", frameId)

    if (error) {
      console.error("Admin frame delete error:", error)
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin frames DELETE error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
