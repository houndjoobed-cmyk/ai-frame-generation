import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Edge Middleware — runs BEFORE any page/API is rendered.
 *
 * Responsibilities:
 *  1. Protect /dashboard/* and /admin/* from unauthenticated users
 *  2. Inject security headers (CSP, HSTS) on every response
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── 1. Auth guard ───────────────────────────────────────────
  // NextAuth v5 beta stores the session token in this cookie.
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value

  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin")

  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ─── 2. Security headers ────────────────────────────────────
  const response = NextResponse.next()

  // HSTS — force HTTPS for 2 years, include subdomains, allow preload list
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  )

  // CSP — restrictive but compatible with Next.js, Vercel Analytics, and inline styles
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // Scripts: self + Vercel analytics + KkiaPay + inline for Next.js hydration
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.kkiapay.me https://va.vercel-scripts.com",
      // Styles: self + inline (Tailwind, Radix)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs + blob + Supabase storage + Google avatars
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://lh3.googleusercontent.com",
      // Fonts: self + data URIs
      "font-src 'self' data:",
      // API connections: self + Supabase + Replicate + Brevo + Resend + KkiaPay + Vercel
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.replicate.com https://api.brevo.com https://api.resend.com https://cdn.kkiapay.me https://va.vercel-scripts.com",
      // Frames: deny everything except KkiaPay payment iframe
      "frame-src 'self' https://cdn.kkiapay.me",
      // Objects: none
      "object-src 'none'",
      // Base URI: self only
      "base-uri 'self'",
      // Form actions: self only
      "form-action 'self'",
      // Frame ancestors: none (replaces X-Frame-Options)
      "frame-ancestors 'none'",
    ].join("; ")
  )

  return response
}

/**
 * Matcher — only run middleware on pages that need it.
 * Exclude static files, images, favicon, and API auth routes (NextAuth handles its own).
 */
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
