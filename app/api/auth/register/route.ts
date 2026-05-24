import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendVerificationEmail } from "@/lib/mail"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Rate Limiting: max 5 requests per 15 mins per IP
    const limitResult = await rateLimit("auth:register", 5, 15 * 60 * 1000)
    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Trop de tentatives d'inscription. Veuillez réessayer dans 15 minutes." },
        { status: 429 }
      )
    }

    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      )
    }

    // Create user in next_auth schema
    const { data: user, error: userError } = await supabase
      .schema("next_auth")
      .from("users")
      .insert({
        name,
        email,
        emailVerified: null,
        image: null,
      })
      .select()
      .single()

    if (userError) {
      console.error("Error creating user:", userError)
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      )
    }

    // Hash password and store it
    const passwordHash = await bcrypt.hash(password, 12)

    const { error: passwordError } = await supabase
      .from("user_passwords")
      .insert({
        user_id: user.id,
        password_hash: passwordHash,
      })

    if (passwordError) {
      // Rollback user creation
      await supabase
        .schema("next_auth")
        .from("users")
        .delete()
        .eq("id", user.id)

      console.error("Error storing password:", passwordError)
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      )
    }
    // Generate verification token
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

    if (tokenError) {
      console.error("Error creating verification token:", tokenError)
    } else {
      try {
        await sendVerificationEmail(email, name, token)
      } catch (mailErr) {
        console.error("Error sending verification email:", mailErr)
      }
    }

    return NextResponse.json({ success: true, requiresVerification: true, email })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
