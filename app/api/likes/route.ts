import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { likeFrameSchema } from "@/lib/validations"
import { z } from "zod"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour aimer un cadre." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = likeFrameSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "ID du cadre manquant ou invalide."
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

    const { frameId } = parsed.data
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("frame_likes")
      .insert({
        user_id: session.user.id,
        frame_id: frameId
      })
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation (user already liked this frame)
      if (error.code === "23505") {
        return NextResponse.json({ success: true, message: "Déjà aimé" })
      }
      console.error("Database error liking frame:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de l'enregistrement de la mention J'aime." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, like: data })

  } catch (error) {
    console.error("Likes endpoint POST error:", error)
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
        { success: false, error: "Vous devez être connecté pour retirer votre mention J'aime." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const frameId = searchParams.get("frameId")

    if (!frameId || !z.string().uuid().safeParse(frameId).success) {
      return NextResponse.json(
        { success: false, error: "ID du cadre manquant ou invalide." },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("frame_likes")
      .delete()
      .eq("user_id", session.user.id)
      .eq("frame_id", frameId)
      .select()

    if (error) {
      console.error("Database error unliking frame:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la suppression de la mention J'aime." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Likes endpoint DELETE error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}
