import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Ensure accidental localhost NEXTAUTH_URL / AUTH_URL on Vercel production
// never causes NextAuth middleware to redirect mobile devices to localhost:3000.
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  if (process.env.NEXTAUTH_URL?.includes("localhost")) {
    delete process.env.NEXTAUTH_URL
  }
  if (process.env.AUTH_URL?.includes("localhost")) {
    delete process.env.AUTH_URL
  }
}

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard", "/admin"]
  const isProtectedRoute = protectedPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  )

  // Auth routes (login, register) — redirect to dashboard if already logged in
  const authPaths = ["/auth/login", "/auth/register"]
  const isAuthRoute = authPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  )

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/auth/login", nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin))
  }

  // Create response to inject headers
  const response = NextResponse.next()

  // HSTS — force HTTPS for 2 years, include subdomains, allow preload list
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  )

  // CSP — compatible with Next.js, iOS WebKit OAuth redirects, and Supabase Realtime WebSockets
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // Scripts: self + Vercel analytics + KkiaPay + inline for Next.js hydration
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.kkiapay.me https://va.vercel-scripts.com",
      // Styles: self + inline (Tailwind, Radix)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs + blob + Supabase storage + Google avatars + Unsplash
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://lh3.googleusercontent.com https://images.unsplash.com",
      // Fonts: self + data URIs
      "font-src 'self' data:",
      // API connections: self + Supabase HTTPS & WSS (for NotificationBell after login) + Google OAuth + Replicate + Brevo + Resend + KkiaPay + Vercel
      "connect-src 'self' data: blob: https://*.supabase.co wss://*.supabase.co https://*.supabase.in wss://*.supabase.in https://accounts.google.com https://api.replicate.com https://api.brevo.com https://api.resend.com https://cdn.kkiapay.me https://va.vercel-scripts.com",
      // Frames: deny everything except KkiaPay payment iframe & Google OAuth
      "frame-src 'self' https://cdn.kkiapay.me https://accounts.google.com",
      // Objects: none
      "object-src 'none'",
      // Base URI: self only
      "base-uri 'self'",
      // Form actions: self + Google OAuth (critical on iOS WebKit which enforces form-action across 302 redirects)
      "form-action 'self' https://accounts.google.com",
      // Frame ancestors: none (replaces X-Frame-Options)
      "frame-ancestors 'none'",
    ].join("; ")
  )

  return response
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon-*, apple-icon* (favicon files)
     * - api/auth/* (NextAuth handles its own auth)
     * - public files with extensions (.png, .jpg, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon-|apple-icon|api/auth|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot)).*)",
  ],
}
