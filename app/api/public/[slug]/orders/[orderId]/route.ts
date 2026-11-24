/**
 * GET /api/public/[slug]/orders/[orderId]
 * Public endpoint to poll order status for live tracking.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; orderId: string }> }
) {
  try {
    const { slug, orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          select: {
            name: true,
            slug: true,
            currencySymbol: true,
            taxRate: true,
            wifiName: true,
            wifiPassword: true,
          },
        },
        table: {
          select: {
            tableNumber: true,
          },
        },
        orderItems: {
          select: {
            id: true,
            nameSnapshot: true,
            priceSnapshot: true,
            quantity: true,
            notes: true,
            menuItem: {
              select: {
                imageUrl: true,
                prepTime: true,
              },
            },
          },
        },
      },
    });

    if (!order || order.restaurant.slug !== slug) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("[/api/public/orders/[orderId] error]:", err);
    return NextResponse.json(
      { error: "Failed to load order" },
      { status: 500 }
    );
  }
}
