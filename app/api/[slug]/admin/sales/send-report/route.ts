/**
 * POST /api/[slug]/admin/sales/send-report
 * Triggered manually from Admin Sales page to dispatch today's EOD report immediately.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";
import { notifyDailyReport } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const ctx = await requireAdminForSlug(req, slug);
    if (!isTenantContext(ctx)) return ctx;
    const { restaurantId } = ctx;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        currencySymbol: true,
        whatsappNumber: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: todayStart },
        status: { not: "CANCELLED" },
      },
      include: {
        orderItems: { select: { nameSnapshot: true, quantity: true } },
      },
    });

    const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");
    const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    const dishCounts: Record<string, number> = {};
    for (const order of orders) {
      for (const item of order.orderItems) {
        dishCounts[item.nameSnapshot] =
          (dishCounts[item.nameSnapshot] || 0) + item.quantity;
      }
    }

    let topDish: string | undefined;
    let max = 0;
    for (const [name, count] of Object.entries(dishCounts)) {
      if (count > max) {
        max = count;
        topDish = `${name} (${count} sold)`;
      }
    }

    const dateStr = todayStart.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const res = await notifyDailyReport(restaurant, {
      dateStr,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      totalRevenue,
      topDish,
    });

    return NextResponse.json({
      ok: true,
      message: `Daily report dispatched (${res.status})`,
      stats: {
        totalOrders: orders.length,
        totalRevenue,
      },
    });
  } catch (err) {
    console.error("[/api/admin/sales/send-report error]:", err);
    return NextResponse.json(
      { error: "Failed to dispatch daily report" },
      { status: 500 }
    );
  }
}
