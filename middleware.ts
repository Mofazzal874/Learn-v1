import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Exclude API routes from middleware
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Get user session
  const user = req.auth?.user;

  // Routes that require authentication
  const protectedRoutes = ["/private", "/tutor"];

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/role-select?mode=login", nextUrl));
  }

  // If it's a tutor route, check if user has tutor role
  if (pathname.startsWith("/tutor") && user) {
    if (user.role !== "tutor") {
      return NextResponse.redirect(new URL("/role-select?mode=login", nextUrl));
    }
  }

  // If it's a private route, check if user has appropriate role
  if (pathname.startsWith("/private") && user) {
    if (user.role === "tutor") {
      return NextResponse.redirect(new URL("/tutor/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};