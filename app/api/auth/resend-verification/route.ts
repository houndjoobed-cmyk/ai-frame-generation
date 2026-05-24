import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendVerificationEmail } from "@/lib/mail"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if user exists and is not verified
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

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "Email already verified" })
    }

    // Delete any existing verification tokens for this user
    await supabase
      .schema("next_auth")
      .from("verification_tokens")
      .delete()
      .eq("identifier", email)
      .like("token", "verify_%")

    // Generate new verification token
    const token = `verify_${crypto.randomUUID()}`
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const { error: tokenError } = await supabase
      .schema("next_auth")
      .from("verification_tokens")
      .insert({
        identifier: email,
        token: token,
        expires: expires.toISOString(),
      })

    if (!tokenError) {
      await sendVerificationEmail(email, user.name, token)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
