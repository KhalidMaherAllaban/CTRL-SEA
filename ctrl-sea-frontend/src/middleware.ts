import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = [
  "/admin",
  "/chokepoints",
  "/climate-risk",
  "/countries",
  "/dashboard",
  "/disruptions",
  "/map",
  "/ports",
  "/reports",
  "/risk-center",
  "/spillover",
  "/trade-flows",
  "/trade-risk",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("ctrl_sea_access")?.value || request.cookies.get("ctrl_sea_refresh")?.value);
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/chokepoints/:path*",
    "/climate-risk/:path*",
    "/countries/:path*",
    "/dashboard/:path*",
    "/disruptions/:path*",
    "/login",
    "/map/:path*",
    "/ports/:path*",
    "/reports/:path*",
    "/risk-center/:path*",
    "/spillover/:path*",
    "/trade-flows/:path*",
    "/trade-risk/:path*",
  ],
};
