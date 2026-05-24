import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendPasswordResetEmail } from "@/lib/mail"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Rate Limiting: max 3 requests per 15 mins per IP
    const limitResult = await rateLimit("auth:forgot-password", 3, 15 * 60 * 1000)
    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Trop de tentatives de demande de réinitialisation. Veuillez réessayer dans 15 minutes." },
        { status: 429 }
      )
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if user exists in next_auth schema
    const { data: user, error: userError } = await supabase
      .schema("next_auth")
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (userError || !user) {
      // Return success to prevent enumeration
      return NextResponse.json({ success: true })
    }

    // Delete any existing reset tokens for this user
    await supabase
      .schema("next_auth")
      .from("verification_tokens")
      .delete()
      .eq("identifier", email)
      .like("token", "reset_%")

    // Generate new reset token
    const token = `reset_${crypto.randomUUID()}`
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    const { error: tokenError } = await supabase
      .schema("next_auth")
      .from("verification_tokens")
      .insert({
        identifier: email,
        token: token,
        expires: expires.toISOString(),
      })

    if (!tokenError) {
      await sendPasswordResetEmail(email, token)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
