import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Rate Limiting: max 10 requests per 15 mins per IP
    const limitResult = await rateLimit("auth:verify-email", 10, 15 * 60 * 1000)
    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Trop de tentatives de vérification. Veuillez réessayer dans 15 minutes." },
        { status: 429 }
      )
    }

    const { token, email } = await req.json()

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Retrieve token from next_auth.verification_tokens
    const { data: tokenData, error: tokenError } = await supabase
      .schema("next_auth")
      .from("verification_tokens")
      .select("*")
      .eq("token", token)
      .eq("identifier", email)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "Invalid token or email" },
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

    // Verify user email in next_auth.users
    const { error: userError } = await supabase
      .schema("next_auth")
      .from("users")
      .update({ emailVerified: new Date().toISOString() })
      .eq("email", email)

    if (userError) {
      console.error("Error updating user verification status:", userError)
      return NextResponse.json(
        { error: "Failed to verify email" },
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
    console.error("Verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
