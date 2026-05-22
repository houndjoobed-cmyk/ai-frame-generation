import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    console.log("Kkiapay webhook received payload:", payload)

    const transactionId = payload.transactionId || payload.ref
    const status = payload.status

    if (!transactionId) {
      return NextResponse.json({ success: false, error: "Missing transaction reference." }, { status: 400 })
    }

    if (status !== "SUCCESS") {
      console.log(`Kkiapay webhook ignored for non-success status: ${status}`)
      return NextResponse.json({ success: true, message: "Webhook acknowledged" })
    }

    // Optional webhook signature verification
    const secretHeader = req.headers.get("x-kkiapay-secret")
    console.log("Kkiapay webhook x-kkiapay-secret header:", secretHeader)

    // Extract transaction metadata
    let metadata: any = null
    try {
      if (payload.data) {
        metadata = JSON.parse(payload.data)
      }
    } catch (e) {
      console.error("Failed to parse webhook metadata payload:", e)
    }

    if (!metadata || !metadata.userId || !metadata.planId) {
      console.error("Missing or invalid user/plan metadata in webhook")
      return NextResponse.json({ success: false, error: "Invalid metadata." }, { status: 400 })
    }

    const { userId, planId, isAnnual } = metadata
    const supabase = createAdminClient()

    // 1. Fetch Plan Details to get max credits
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .maybeSingle()

    if (planError) {
      console.error("Database error fetching plan in webhook:", planError)
      return NextResponse.json({ success: false, error: "Database error." }, { status: 500 })
    }

    // Determine features if plan was not found in DB
    const maxCredits = plan?.max_ai_credits_per_month || (planId === "pro-plan-id" ? 100 : planId === "business-plan-id" ? 9999 : 5)

    // Calculate subscription validity end date
    const durationDays = isAnnual ? 365 : 30
    const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()

    // 2. Insert/Update user subscription
    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()

    if (existingSub) {
      const { error: subUpdateError } = await supabase
        .from("user_subscriptions")
        .update({
          plan_id: planId,
          payment_reference: transactionId,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSub.id)

      if (subUpdateError) {
        console.error("Failed to update user subscription via webhook:", subUpdateError)
        return NextResponse.json({ success: false, error: "Database error." }, { status: 500 })
      }
    } else {
      const { error: subInsertError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          plan_id: planId,
          status: "active",
          payment_provider: "kkiapay",
          payment_reference: transactionId,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd,
        })

      if (subInsertError) {
        console.error("Failed to insert user subscription via webhook:", subInsertError)
        return NextResponse.json({ success: false, error: "Database error." }, { status: 500 })
      }
    }

    // 3. Refill user AI Credits
    const { error: creditsError } = await supabase
      .from("ai_credits")
      .upsert({
        user_id: userId,
        total_credits: maxCredits,
        used_credits: 0,
        last_refill_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id"
      })

    if (creditsError) {
      console.error("Failed to refill AI credits via webhook:", creditsError)
    }

    return NextResponse.json({ success: true, message: "Webhook processed and subscription updated." })
  } catch (error) {
    console.error("Kkiapay webhook route error:", error)
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 })
  }
}
