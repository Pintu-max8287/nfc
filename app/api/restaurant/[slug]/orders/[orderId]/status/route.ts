/**
 * PATCH /api/restaurant/[slug]/orders/[orderId]/status
 * Updates order status (NEW -> PREPARING -> READY -> SERVED -> CANCELLED).
 * Validates that user belongs to this restaurant (RESTAURANT_ADMIN, KITCHEN_STAFF, or SUPER_ADMIN).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

const statusSchema = z.object({
  status: z.enum(["NEW", "PREPARING", "READY", "SERVED", "CANCELLED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; orderId: string }> }
) {
  try {
    const { slug, orderId } = await params;

    // Verify staff belongs to this restaurant
    const ctx = await requireAdminForSlug(req, slug, [
      "RESTAURANT_ADMIN",
      "KITCHEN_STAFF",
      "SUPER_ADMIN",
    ]);

    if (!isTenantContext(ctx)) return ctx;
    const { restaurantId } = ctx;

    const body = await req.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status value", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status } = parsed.data;

    // Verify order exists and belongs to this tenant
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found in this restaurant" },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        table: { select: { tableNumber: true } },
        orderItems: {
          select: {
            id: true,
            nameSnapshot: true,
            priceSnapshot: true,
            quantity: true,
            notes: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      order: updatedOrder,
    });
  } catch (err) {
    console.error("[/api/restaurant/[slug]/orders/status error]:", err);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
