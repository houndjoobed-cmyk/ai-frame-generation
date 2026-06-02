import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import bcrypt from "bcryptjs"
import { createAdminClient } from "@/lib/supabase/admin"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // ⚠️ SECURITY DECISION: Allows linking a Google account to an existing
      // credentials account with the same email. This is intentional for UX —
      // users who registered with email can later sign in with Google seamlessly.
      // Risk: If an attacker controls a Google account with a victim's email,
      // they could access the victim's account. Mitigated by Google's own
      // email verification and the fact our user base is trusted (event organizers).
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const supabase = createAdminClient()

        // Get user from next_auth schema
        const { data: user, error } = await supabase
          .schema("next_auth")
          .from("users")
          .select("*")
          .eq("email", credentials.email as string)
          .single()

        if (error || !user) {
          return null
        }

        // Enforce email verification
        if (!user.emailVerified) {
          throw new Error("EmailNotVerified")
        }

        // Get password from a separate passwords table
        const { data: passwordData } = await supabase
          .from("user_passwords")
          .select("password_hash")
          .eq("user_id", user.id)
          .single()

        if (!passwordData) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          passwordData.password_hash
        )

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        // Fetch role from profiles on initial sign-in
        try {
          const supabase = createAdminClient()
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single()
          token.role = profile?.role || "user"
        } catch {
          token.role = "user"
        }
      }
      // Refresh role periodically (every session update)
      if (trigger === "update" && token.id) {
        try {
          const supabase = createAdminClient()
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", token.id as string)
            .single()
          token.role = profile?.role || "user"
        } catch {
          // Keep existing role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || "user"
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
})
