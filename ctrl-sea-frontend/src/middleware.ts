import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = [
  "/admin",
  "/ai",
  "/analytics",
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
  "/trade-risk",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("ctrl_sea_access")?.value || request.cookies.get("ctrl_sea_refresh")?.value);
  const isReportAsset = pathname.startsWith("/reports/") && /\.[a-z0-9]+$/i.test(pathname);
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isReportAsset) {
    return NextResponse.next();
  }

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
    "/ai/:path*",
    "/analytics/:path*",
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
    "/trade-risk/:path*",
  ],
};
