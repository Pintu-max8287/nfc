/**
 * POST /api/public/[slug]/service-request
 * Public endpoint for table customers to request a waiter or bill.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const serviceRequestSchema = z.object({
  tableNumber: z.string().min(1),
  type: z.enum(["WAITER_CALL", "BILL_REQUEST"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = serviceRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tableNumber, type } = parsed.data;

    // Verify restaurant is active
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json(
        { error: "Restaurant not found or inactive" },
        { status: 404 }
      );
    }

    // Verify table exists
    const table = await prisma.table.findUnique({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber,
        },
      },
      select: { id: true, isActive: true },
    });

    if (!table || !table.isActive) {
      return NextResponse.json(
        { error: "Table not found or inactive" },
        { status: 404 }
      );
    }

    // Create service request
    const request = await prisma.serviceRequest.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        type,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      ok: true,
      message:
        type === "WAITER_CALL"
          ? "Waiter notified! Staff will arrive shortly."
          : "Bill requested! Staff has been alerted.",
      requestId: request.id,
    });
  } catch (err) {
    console.error("[/api/public/service-request error]:", err);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
