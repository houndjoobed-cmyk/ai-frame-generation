import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 })
    }

    const supabase = createAdminClient()
    
    // Find active subscription
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle()

    if (subError) {
      console.error("Database error looking up active subscription:", subError)
      return NextResponse.json({ success: false, error: "Erreur de base de données." }, { status: 500 })
    }

    if (!subscription) {
      return NextResponse.json({ success: false, error: "Aucun abonnement actif trouvé." }, { status: 404 })
    }

    // Cancel subscription (marks status as cancelled, keeps period end active)
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)

    if (updateError) {
      console.error("Failed to update subscription status to cancelled:", updateError)
      return NextResponse.json({ success: false, error: "Impossible de résilier l'abonnement." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Kkiapay cancel route error:", error)
    return NextResponse.json({ success: false, error: "Une erreur interne est survenue." }, { status: 500 })
  }
}
