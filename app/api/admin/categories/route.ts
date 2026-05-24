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
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Fetch categories with frame count
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order")

    if (error) {
      console.error("Admin categories fetch error:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    // Count frames per category
    const { data: frameCounts } = await supabase
      .from("frames")
      .select("category_id")

    const countMap: Record<string, number> = {}
    for (const f of frameCounts || []) {
      if (f.category_id) {
        countMap[f.category_id] = (countMap[f.category_id] || 0) + 1
      }
    }

    const enriched = (categories || []).map((c: any) => ({
      ...c,
      frame_count: countMap[c.id] || 0,
    }))

    return NextResponse.json({ data: enriched })
  } catch (error) {
    console.error("Admin categories error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const { name, slug, description, icon, color, sort_order } = await req.json()

    if (!name || !slug) {
      return NextResponse.json({ error: "Le nom et le slug sont requis" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        description: description || null,
        icon: icon || null,
        color: color || null,
        sort_order: sort_order || 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Admin category create error:", error)
      if (error.code === "23505") {
        return NextResponse.json({ error: "Une catégorie avec ce slug existe déjà" }, { status: 409 })
      }
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("Admin categories POST error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const { id, name, slug, description, icon, color, sort_order, is_active } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "L'identifiant est requis" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Admin category update error:", error)
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Admin categories PUT error:", error)
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
    const categoryId = searchParams.get("id")

    if (!categoryId) {
      return NextResponse.json({ error: "ID de catégorie requis" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if any frames reference this category
    const { count } = await supabase
      .from("frames")
      .select("*", { count: "exact", head: true })
      .eq("category_id", categoryId)

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer : ${count} frames utilisent cette catégorie` },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)

    if (error) {
      console.error("Admin category delete error:", error)
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin categories DELETE error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
