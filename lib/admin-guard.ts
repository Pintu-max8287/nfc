/**
 * lib/admin-guard.ts
 * Reusable tenant-scoped auth guard for Restaurant Admin API routes.
 * Every admin API route calls this first — never trust client-sent restaurantId.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface TenantContext {
  session: SessionPayload;
  restaurantId: string;
}

/**
 * Verifies the caller owns the restaurant identified by `slug`.
 * Returns `{ session, restaurantId }` on success, or a 401/403 NextResponse on failure.
 */
export async function requireAdminForSlug(
  req: NextRequest,
  slug: string,
  allowedRoles: SessionPayload["role"][] = ["RESTAURANT_ADMIN", "SUPER_ADMIN"]
): Promise<TenantContext | NextResponse> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Super Admin can access any tenant
  if (session.role === "SUPER_ADMIN") {
    const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }
    return { session, restaurantId: restaurant.id };
  }

  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.restaurantSlug !== slug) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.restaurantId) {
    return NextResponse.json({ error: "No restaurant assigned" }, { status: 403 });
  }

  // Double-check DB ownership (never trust cookie alone for critical mutations)
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: session.restaurantId, slug },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  return { session, restaurantId: restaurant.id };
}

/** Type guard: narrows the return value to TenantContext */
export function isTenantContext(
  val: TenantContext | NextResponse
): val is TenantContext {
  return "restaurantId" in val;
}
