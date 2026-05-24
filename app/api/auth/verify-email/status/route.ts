import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ verified: true }) // fallback to proceed to auth
    }

    const supabase = createAdminClient()

    // Retrieve user from next_auth schema
    const { data: user, error } = await supabase
      .schema("next_auth")
      .from("users")
      .select("emailVerified")
      .eq("email", email)
      .single()

    if (error || !user) {
      // User doesn't exist or error occurred; return verified: true so NextAuth handles credentials check
      return NextResponse.json({ verified: true })
    }

    const isVerified = user.emailVerified !== null
    return NextResponse.json({ verified: isVerified })
  } catch (error) {
    console.error("Error in verification status endpoint:", error)
    return NextResponse.json({ verified: true }) // fallback to proceed to auth
  }
}
