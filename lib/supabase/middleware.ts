import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // NEXT_PUBLIC_* environment variables are available in Edge middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  console.log("[v0] Path:", pathname, "| User:", user ? user.id : "null", "| Cookies:", request.cookies.getAll().map(c => c.name).join(", "))

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login", "/auth/sign-up", "/auth/sign-up-success", "/auth/error", "/auth/callback"]
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route
  )

  if (!user && !isPublicRoute) {
    console.log("[v0] REDIRECT: No user on protected route", pathname, "-> /auth/login")
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (user && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/sign-up"))) {
    console.log("[v0] REDIRECT: Authenticated user on auth page", pathname, "-> /dashboard")
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  console.log("[v0] PASS THROUGH:", pathname)
  return supabaseResponse
}
