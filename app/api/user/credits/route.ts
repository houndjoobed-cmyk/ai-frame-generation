import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("ai_credits")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle()

    if (error) {
      console.error("Error fetching AI credits:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la récupération des crédits" },
        { status: 500 }
      )
    }

    const credits = data || { total_credits: 5, used_credits: 0 }
    return NextResponse.json({ success: true, credits })

  } catch (error) {
    console.error("Credits endpoint error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}
