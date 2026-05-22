import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
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
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
