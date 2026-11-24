/**
 * GET /api/restaurant/[slug]/kitchen
 * Fetches active kitchen orders (NEW, PREPARING, READY) and pending service requests.
 * Used for live SWR polling by the Kitchen Display System (KDS).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const ctx = await requireAdminForSlug(req, slug, [
      "RESTAURANT_ADMIN",
      "KITCHEN_STAFF",
      "SUPER_ADMIN",
    ]);

    if (!isTenantContext(ctx)) return ctx;
    const { restaurantId } = ctx;

    // Fetch active orders (FIFO order - oldest first)
    const [orders, serviceRequests, restaurant] = await Promise.all([
      prisma.order.findMany({
        where: {
          restaurantId,
          status: { in: ["NEW", "PREPARING", "READY"] },
        },
        orderBy: { createdAt: "asc" },
        include: {
          table: {
            select: { tableNumber: true },
          },
          orderItems: {
            select: {
              id: true,
              nameSnapshot: true,
              quantity: true,
              notes: true,
            },
          },
        },
      }),
      prisma.serviceRequest.findMany({
        where: {
          restaurantId,
          status: "PENDING",
        },
        orderBy: { createdAt: "asc" },
        include: {
          table: {
            select: { tableNumber: true },
          },
        },
      }),
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { name: true, slug: true },
      }),
    ]);

    return NextResponse.json({
      restaurant,
      orders,
      serviceRequests,
    });
  } catch (err) {
    console.error("[/api/restaurant/[slug]/kitchen error]:", err);
    return NextResponse.json(
      { error: "Failed to load kitchen feed" },
      { status: 500 }
    );
  }
}
