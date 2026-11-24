/**
 * POST /api/public/[slug]/orders
 * Public endpoint to place an order from a table.
 * Decrements stockCount, triggers low-stock check, fires new order alert.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";

const orderItemInputSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

const placeOrderSchema = z.object({
  tableNumber: z.string().min(1),
  items: z.array(orderItemInputSchema).min(1, "Cart cannot be empty"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = placeOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order data", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tableNumber, items } = parsed.data;

    // Fetch restaurant and active table
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        currencySymbol: true,
        taxRate: true,
        whatsappNumber: true,
        isActive: true,
      },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json(
        { error: "Restaurant is currently inactive or not found" },
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

    if (!table || !table.isActive) {
      return NextResponse.json(
        { error: "Table is inactive or not found" },
        { status: 404 }
      );
    }

    // Verify all menu items exist and belong to this restaurant
    const itemIds = items.map((i) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: itemIds },
        restaurantId: restaurant.id,
      },
    });

    if (dbMenuItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: "One or more items in cart are unavailable" },
        { status: 400 }
      );
    }

    const itemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    // Check stock & availability
    for (const orderItem of items) {
      const dbItem = itemMap.get(orderItem.menuItemId)!;
      if (!dbItem.isAvailable) {
        return NextResponse.json(
          { error: `"${dbItem.name}" is currently sold out.` },
          { status: 400 }
        );
      }
      if (dbItem.stockCount !== null && dbItem.stockCount < orderItem.quantity) {
        return NextResponse.json(
          {
            error: `Only ${dbItem.stockCount} portions left of "${dbItem.name}".`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    for (const orderItem of items) {
      const dbItem = itemMap.get(orderItem.menuItemId)!;
      subtotal += dbItem.price * orderItem.quantity;
    }

    const taxAmount = Number(((subtotal * restaurant.taxRate) / 100).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    // Next orderNumber for this restaurant
    const lastOrder = await prisma.order.findFirst({
      where: { restaurantId: restaurant.id },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    const orderNumber = (lastOrder?.orderNumber ?? 100) + 1;

    // Transaction: Create Order, create OrderItems, decrement stock
    const lowStockAlerts: Array<{ name: string; remaining: number }> = [];

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          restaurantId: restaurant.id,
          tableId: table.id,
          status: "NEW",
          subtotal,
          taxAmount,
          totalAmount,
          paymentStatus: "UNPAID",
          orderItems: {
            create: items.map((i) => {
              const dbItem = itemMap.get(i.menuItemId)!;
              return {
                menuItemId: i.menuItemId,
                nameSnapshot: dbItem.name,
                priceSnapshot: dbItem.price,
                quantity: i.quantity,
                notes: i.notes || null,
              };
            }),
          },
        },
      });

      // Update stocks
      for (const orderItem of items) {
        const dbItem = itemMap.get(orderItem.menuItemId)!;
        if (dbItem.stockCount !== null) {
          const updatedStock = Math.max(0, dbItem.stockCount - orderItem.quantity);
          await tx.menuItem.update({
            where: { id: dbItem.id },
            data: {
              stockCount: updatedStock,
              isAvailable: updatedStock > 0,
            },
          });

          if (updatedStock <= dbItem.lowStockThreshold) {
            lowStockAlerts.push({
              name: dbItem.name,
              remaining: updatedStock,
            });
          }
        }
      }

      return newOrder;
    });

    // Send notifications in background (non-blocking for response)
    (async () => {
      // 1. New Order alert
      if (restaurant.whatsappNumber) {
        await sendNotification({
          restaurantId: restaurant.id,
          type: "NEW_ORDER",
          recipient: restaurant.whatsappNumber,
          message: `🍽️ New Order #${orderNumber} for Table ${tableNumber}! Total: ${restaurant.currencySymbol}${totalAmount} (${items.length} dishes).`,
        });
      }

      // 2. Low-stock alerts
      for (const alert of lowStockAlerts) {
        if (restaurant.whatsappNumber) {
          await sendNotification({
            restaurantId: restaurant.id,
            type: "LOW_STOCK",
            recipient: restaurant.whatsappNumber,
            message: `⚠️ Low Stock Warning: "${alert.name}" has only ${alert.remaining} portions remaining!`,
          });
        }
      }
    })().catch(console.error);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    });
  } catch (err) {
    console.error("[/api/public/orders error]:", err);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}
