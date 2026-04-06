import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "token";

const PROTECTED_PATHS = [
  "/dashboard",
  "/transactions",
  "/insights",
  "/profile",
  "/onboarding",
  "/admin",
];
const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isProtectedPath = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!token && isProtectedPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/insights/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
