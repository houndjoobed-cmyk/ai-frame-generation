import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 })
    }

    const { name, bio } = await req.json()

    if (!name) {
      return NextResponse.json({ success: false, error: "Le nom est requis" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Fetch existing profile to get its PK id
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle()

    if (fetchError) {
      console.error("Error fetching profile in update:", fetchError)
      return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
    }

    // 2. Upsert profile with corrected fields
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: profile?.id, // if undefined, a new ID will be generated
        user_id: session.user.id,
        display_name: name,
        bio: bio || "",
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      console.error("Error upserting profile:", upsertError)
      return NextResponse.json({ success: false, error: "Impossible de mettre à jour le profil" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile update endpoint error:", error)
    return NextResponse.json({ success: false, error: "Une erreur interne est survenue" }, { status: 500 })
  }
}
