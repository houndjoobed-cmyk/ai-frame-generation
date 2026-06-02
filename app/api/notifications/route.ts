import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { updateNotificationSchema } from "@/lib/validations"
import { z } from "zod"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const category = searchParams.get("category") || ""
    const unreadOnly = searchParams.get("unread") === "true"

    const supabase = createAdminClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (category) {
      query = query.eq("category", category)
    }

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data, count, error } = await query

    if (error) {
      console.error("Notifications fetch error:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    // Also get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false)

    return NextResponse.json({
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        unreadCount: unreadCount || 0,
      },
    })
  } catch (error) {
    console.error("Notifications GET error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = updateNotificationSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Données invalides"
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { notificationId, markAllRead } = parsed.data
    const supabase = createAdminClient()

    if (markAllRead) {
      // Mark all notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", session.user.id)
        .eq("is_read", false)

      if (error) {
        console.error("Mark all read error:", error)
        return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Toutes les notifications ont été marquées comme lues" })
    }

    if (notificationId) {
      // Mark a single notification as read
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", session.user.id)

      if (error) {
        console.error("Mark notification read error:", error)
        return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "notificationId ou markAllRead est requis" }, { status: 400 })
  } catch (error) {
    console.error("Notifications PATCH error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get("id")

    if (!notificationId || !z.string().uuid().safeParse(notificationId).success) {
      return NextResponse.json({ error: "ID de notification invalide ou requis" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", session.user.id)

    if (error) {
      console.error("Notification delete error:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications DELETE error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
