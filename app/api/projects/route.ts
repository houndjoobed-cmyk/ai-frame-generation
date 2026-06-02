import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { createProjectSchema, updateProjectSchema } from "@/lib/validations"
import { z } from "zod"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour enregistrer un projet." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = createProjectSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Données invalides"
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

    const { name, canvasData, thumbnailUrl, canvasWidth, canvasHeight } = parsed.data
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: session.user.id,
        name,
        canvas_data: canvasData,
        thumbnail_url: thumbnailUrl,
        canvas_width: canvasWidth,
        canvas_height: canvasHeight,
        status: "draft"
      })
      .select()
      .single()

    if (error) {
      console.error("Database error saving project:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la sauvegarde dans la base de données." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, project: data })

  } catch (error) {
    console.error("Projects endpoint error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour supprimer un projet." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id || !z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { success: false, error: "ID du projet invalide ou manquant." },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Delete project only if it belongs to the authenticated user
    const { data, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()

    if (error) {
      console.error("Database error deleting project:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la suppression dans la base de données." },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Projet non trouvé ou non autorisé." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Projects delete error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour charger un projet." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id || !z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { success: false, error: "ID du projet invalide ou manquant." },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single()

    if (error) {
      console.error("Database error fetching project:", error)
      return NextResponse.json(
        { success: false, error: "Projet introuvable." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, project: data })

  } catch (error) {
    console.error("Projects GET error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour modifier un projet." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = updateProjectSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Données invalides"
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

    const { id, name, canvasData, thumbnailUrl, canvasWidth, canvasHeight } = parsed.data
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("projects")
      .update({
        name,
        canvas_data: canvasData,
        thumbnail_url: thumbnailUrl,
        canvas_width: canvasWidth,
        canvas_height: canvasHeight,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single()

    if (error) {
      console.error("Database error updating project:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la mise à jour du projet." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, project: data })

  } catch (error) {
    console.error("Projects PUT error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}

