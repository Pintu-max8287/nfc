/**
 * GET /api/public/[slug]/table/[tableNumber]/bill
 * Aggregates all active unpaid orders for this table into an itemized bill.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; tableNumber: string }> }
) {
  try {
    const { slug, tableNumber } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        currencySymbol: true,
        taxRate: true,
        isActive: true,
      },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json(
        { error: "Restaurant not found or inactive" },
        { status: 404 }
      );
    }

    const table = await prisma.table.findUnique({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber,
        },
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Unpaid active orders
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        tableId: table.id,
        paymentStatus: "UNPAID",
        status: { not: "CANCELLED" },
      },
      include: {
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
      orderBy: { createdAt: "desc" },
    });

    const subtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const taxAmount = orders.reduce((sum, o) => sum + o.taxAmount, 0);
    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return NextResponse.json({
      restaurant,
      tableNumber,
      orders,
      subtotal,
      taxAmount,
      totalAmount,
    });
  } catch (err) {
    console.error("[/api/public/bill error]:", err);
    return NextResponse.json(
      { error: "Failed to load bill" },
      { status: 500 }
    );
  }
}
