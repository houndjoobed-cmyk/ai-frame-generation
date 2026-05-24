import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Rate Limiting: max 5 requests per 15 mins per IP
    const limitResult = await rateLimit("auth:reset-password", 5, 15 * 60 * 1000)
    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Trop de tentatives de réinitialisation de mot de passe. Veuillez réessayer dans 15 minutes." },
        { status: 429 }
      )
    }

    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find and validate token
    const { data: tokenData, error: tokenError } = await supabase
      .schema("next_auth")
      .from("verification_tokens")
      .select("*")
      .eq("token", token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    // Check expiration
    const expires = new Date(tokenData.expires)
    if (expires < new Date()) {
      // Delete expired token
      await supabase
        .schema("next_auth")
        .from("verification_tokens")
        .delete()
        .eq("token", token)

      return NextResponse.json(
        { error: "Token has expired" },
        { status: 400 }
      )
    }

    // Email is stored in tokenData.identifier
    const email = tokenData.identifier

    // Get user from next_auth schema
    const { data: user, error: userError } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 400 }
      )
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update password in user_passwords table
    const { error: passwordError } = await supabase
      .from("user_passwords")
      .upsert({
        user_id: user.id,
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

    if (passwordError) {
      console.error("Error resetting password:", passwordError)
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    // Delete token
    await supabase
      .schema("next_auth")
      .from("verification_tokens")
      .delete()
      .eq("token", token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
