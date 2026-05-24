import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard", "/editor"]
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
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all routes except static files, api routes, and Next.js internals
    "/((?!api|_next/static|_next/image|favicon.ico|icon.*|apple-icon.*|.*\\.png$|.*\\.svg$).*)",
  ],
}
