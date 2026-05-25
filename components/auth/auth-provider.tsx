"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User, Session } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ 
  children, 
  initialSession = null 
}: { 
  children: React.ReactNode
  initialSession?: Session | null
}) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [isLoading, setIsLoading] = useState(!initialSession)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // If we don't have an initial session, try to fetch it
    if (!initialSession) {
      supabase.auth.getSession().then((res: any) => {
        const session = res?.data?.session
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }).catch((err: any) => {
        console.error("Auth session error:", err)
        setIsLoading(false)
      })
    }

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
      
      // Force refresh on auth state change to update server components
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use the context directly
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const signOut = async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.reload()
}

// Compatibility hook for existing components that used next-auth
export const useSession = () => {
  const context = useContext(AuthContext)
  
  // Transform to look like next-auth session object
  const nextAuthSession = context.session ? {
    user: {
      id: context.user?.id,
      name: context.user?.user_metadata?.name || context.user?.email?.split('@')[0],
      email: context.user?.email,
      image: context.user?.user_metadata?.avatar_url,
    },
    expires: context.session?.expires_at?.toString() || "",
  } : null

  return {
    data: nextAuthSession,
    status: context.isLoading ? "loading" : (context.session ? "authenticated" : "unauthenticated"),
    update: async () => {}, // Mock update function to avoid TS errors
  }
}
