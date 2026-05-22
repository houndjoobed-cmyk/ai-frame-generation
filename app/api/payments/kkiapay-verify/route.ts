import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json()

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: "Transaction ID is required." },
        { status: 400 }
      )
    }

    // Verify transaction status with Kkiapay API
    // We send request to sandbox or live depending on keys
    const kkiapayUrl = `https://api.kkiapay.me/api/v1/transactions/status/${transactionId}`
    const publicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || "dd9f1b2b801a61ad34f2d72f10b741df0dbb6e22"
    const privateKey = process.env.KKIAPAY_PRIVATE_KEY || "sk_sandbox_..." // user private key or sandbox fallback
    const secretKey = process.env.KKIAPAY_SECRET_KEY || "sec_sandbox_..."

    const response = await fetch(kkiapayUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-API-KEY": publicKey,
        "X-PRIVATE-KEY": privateKey,
        "X-SECRET-KEY": secretKey,
        "Authorization": `Bearer ${privateKey}` // standard Authorization fallback header
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Kkiapay API error response:", errorText)
      return NextResponse.json(
        { success: false, error: "Failed to communicate with Kkiapay API." },
        { status: 502 }
      )
    }

    const data = await response.json()
    console.log("Kkiapay response data:", data)

    // Check status
    if (data.status !== "SUCCESS") {
      return NextResponse.json(
        { success: false, error: `Transaction is not successful. Status: ${data.status}` },
        { status: 400 }
      )
    }

    // Extract transaction metadata
    let metadata: any = null
    try {
      if (data.data) {
        metadata = JSON.parse(data.data)
      }
    } catch (e) {
      console.error("Failed to parse transaction data metadata:", e)
    }

    if (!metadata || !metadata.userId || !metadata.planId) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing transaction metadata." },
        { status: 400 }
      )
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
      console.error("Database error fetching plan:", planError)
      return NextResponse.json(
        { success: false, error: "Failed to retrieve subscription plan details." },
        { status: 500 }
      )
    }

    // Determine features if plan was not found in DB (fallback starter or pro keys)
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
          plan_id: planId === "pro-plan-id" || planId === "business-plan-id" || planId === "free-plan-id" 
            ? planId 
            : planId, // update plan ID
          payment_reference: transactionId,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSub.id)

      if (subUpdateError) {
        console.error("Failed to update existing user subscription:", subUpdateError)
        return NextResponse.json({ success: false, error: "Failed to update subscription." }, { status: 500 })
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
        console.error("Failed to insert user subscription:", subInsertError)
        return NextResponse.json({ success: false, error: "Failed to activate subscription." }, { status: 500 })
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
      console.error("Failed to refill AI credits:", creditsError)
      // We don't fail the transaction since subscription succeeded, but log it
    }

    return NextResponse.json({ success: true, status: "SUCCESS" })
  } catch (error) {
    console.error("Kkiapay verification route error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    )
  }
}
