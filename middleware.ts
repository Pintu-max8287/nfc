/**
 * middleware.ts
 * Edge-runtime middleware enforcing role + tenant isolation.
 *
 * Rules:
 *   /super-admin/login          → public
 *   /super-admin/*              → SUPER_ADMIN only
 *   /[slug]/admin/*             → RESTAURANT_ADMIN (same slug) | SUPER_ADMIN
 *   /[slug]/kitchen/*           → RESTAURANT_ADMIN | KITCHEN_STAFF (same slug) | SUPER_ADMIN
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Super Admin routes ────────────────────────────────────────────────────
  if (pathname.startsWith("/super-admin")) {
    if (pathname === "/super-admin/login") return NextResponse.next();

    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/super-admin/login";
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Slug-scoped admin routes ───────────────────────────────────────────────
  // Match /[slug]/admin/* and /[slug]/kitchen/*
  const adminMatch = pathname.match(/^\/([^/]+)\/(admin|kitchen)(\/.*)?$/);
  if (adminMatch) {
    const slug = adminMatch[1];
    const area = adminMatch[2]; // "admin" | "kitchen"

    const session = await getSessionFromRequest(req);
    if (!session) return redirectToLogin(req);

    // Super Admin may access any tenant
    if (session.role === "SUPER_ADMIN") return NextResponse.next();

    // Must belong to this restaurant
    if (session.restaurantSlug !== slug) return redirectToLogin(req);

    if (area === "admin") {
      if (session.role !== "RESTAURANT_ADMIN") return redirectToLogin(req);
    } else {
      // kitchen
      if (
        session.role !== "RESTAURANT_ADMIN" &&
        session.role !== "KITCHEN_STAFF"
      )
        return redirectToLogin(req);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run middleware on super-admin and any slug-scoped admin/kitchen routes.
  // The broad pattern passes all non-static paths; internal logic filters precisely.
  matcher: [
    "/super-admin/:path*",
    "/:slug/admin/:path*",
    "/:slug/kitchen/:path*",
  ],
};
