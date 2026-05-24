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

    // Webhook signature verification — reject unauthorized requests
    const secretHeader = req.headers.get("x-kkiapay-secret")
    const expectedSecret = process.env.KKIAPAY_WEBHOOK_SECRET
    if (!expectedSecret || !secretHeader || secretHeader !== expectedSecret) {
      console.error("Kkiapay webhook rejected: invalid or missing secret header")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

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

    // Map mock plan IDs to database UUIDs
    const resolvePlanId = (id: string): string => {
      if (id === "free-plan-id" || id === "free") {
        return "91c3dd78-aea6-4ddf-985c-6d9d6ab9c4ee"
      }
      if (id === "pro-plan-id" || id === "pro") {
        return "5dbd986d-89fa-43dd-bd21-13eb6790e276"
      }
      if (id === "business-plan-id" || id === "business") {
        return "d6bbacfc-213b-472c-b2a5-c6dbf9fb4dbc"
      }
      return id
    }

    const targetPlanId = resolvePlanId(planId)

    // 1. Fetch Plan Details to get max credits
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", targetPlanId)
      .maybeSingle()

    if (planError) {
      console.error("Database error fetching plan in webhook:", planError)
      return NextResponse.json({ success: false, error: "Database error." }, { status: 500 })
    }

    // Determine features if plan was not found in DB
    const maxCredits = plan?.max_ai_credits_per_month || (targetPlanId === "5dbd986d-89fa-43dd-bd21-13eb6790e276" ? 100 : targetPlanId === "d6bbacfc-213b-472c-b2a5-c6dbf9fb4dbc" ? 9999 : 5)

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

    let subscriptionId = existingSub?.id

    if (existingSub) {
      const { error: subUpdateError } = await supabase
        .from("user_subscriptions")
        .update({
          plan_id: targetPlanId,
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
      const { data: newSub, error: subInsertError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          plan_id: targetPlanId,
          status: "active",
          payment_provider: "kkiapay",
          payment_reference: transactionId,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd,
        })
        .select("id")
        .single()

      if (subInsertError || !newSub) {
        console.error("Failed to insert user subscription via webhook:", subInsertError)
        return NextResponse.json({ success: false, error: "Database error." }, { status: 500 })
      }
      subscriptionId = newSub.id
    }

    // 2b. Log payment history record in public.payments
    const amountPaid = payload.amount || (isAnnual ? (plan?.price_yearly || 29900) : (plan?.price_monthly || 2990))
    const currency = payload.currency || plan?.currency || "XOF"

    const { error: paymentInsertError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        amount: amountPaid,
        currency: currency,
        provider: "kkiapay",
        provider_reference: transactionId,
        status: "completed",
        description: `Abonnement au forfait ${plan?.name || targetPlanId} (Webhook)`,
        metadata: {
          kkiapay_transaction_id: transactionId,
          plan_id: targetPlanId,
          is_annual: isAnnual,
          webhook_payload: payload,
        },
      })

    if (paymentInsertError) {
      console.error("Failed to record payment in DB via webhook:", paymentInsertError)
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
