/**
 * POST /api/public/[slug]/table/[tableNumber]/pay
 * Processes 3 payment modes:
 * - ONLINE: Marks active orders as PAID with ONLINE paymentMethod.
 * - CASH_AT_TABLE: Records CASH_AT_TABLE, creates a BILL_REQUEST service alert.
 * - PAY_AT_COUNTER: Records PAY_AT_COUNTER, creates a BILL_REQUEST service alert.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const paySchema = z.object({
  paymentMethod: z.enum(["ONLINE", "CASH_AT_TABLE", "PAY_AT_COUNTER"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; tableNumber: string }> }
) {
  try {
    const { slug, tableNumber } = await params;
    const body = await req.json();
    const parsed = paySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const { paymentMethod } = parsed.data;

    // Verify restaurant & table
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true, name: true, currencySymbol: true, isActive: true },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json(
        { error: "Restaurant is inactive or not found" },
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

    // Find all unpaid orders for this table
    const unpaidOrders = await prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        tableId: table.id,
        paymentStatus: "UNPAID",
        status: { not: "CANCELLED" },
      },
      select: { id: true, orderNumber: true, totalAmount: true },
    });

    if (unpaidOrders.length === 0) {
      return NextResponse.json(
        { error: "No unpaid orders found for this table" },
        { status: 400 }
      );
    }

    const totalAmount = unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const orderIds = unpaidOrders.map((o) => o.id);

    if (paymentMethod === "ONLINE") {
      // Mark as PAID
      await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: {
          paymentStatus: "PAID",
          paymentMethod: "ONLINE",
        },
      });
    } else if (paymentMethod === "CASH_AT_TABLE") {
      // Record cash at table and ping staff
      await prisma.$transaction([
        prisma.order.updateMany({
          where: { id: { in: orderIds } },
          data: { paymentMethod: "CASH_AT_TABLE" },
        }),
        prisma.serviceRequest.create({
          data: {
            restaurantId: restaurant.id,
            tableId: table.id,
            type: "BILL_REQUEST",
            status: "PENDING",
          },
        }),
      ]);
    } else {
      // PAY_AT_COUNTER
      await prisma.$transaction([
        prisma.order.updateMany({
          where: { id: { in: orderIds } },
          data: { paymentMethod: "PAY_AT_COUNTER" },
        }),
        prisma.serviceRequest.create({
          data: {
            restaurantId: restaurant.id,
            tableId: table.id,
            type: "BILL_REQUEST",
            status: "PENDING",
          },
        }),
      ]);
    }

    return NextResponse.json({
      ok: true,
      paymentMethod,
      totalAmount,
      ordersPaid: unpaidOrders.length,
      primaryOrderNumber: unpaidOrders[0].orderNumber,
    });
  } catch (err) {
    console.error("[/api/public/pay error]:", err);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
