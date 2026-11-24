/**
 * GET /api/[slug]/admin/sales
 * Sales analytics endpoint returning:
 * - KPI: Today's Revenue, % Growth vs Yesterday, Total Paid Orders, Average Order Value
 * - 7-Day Daily Sales (for Recharts bar chart)
 * - Top-Selling Dishes list
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
    const ctx = await requireAdminForSlug(req, slug);
    if (!isTenantContext(ctx)) return ctx;
    const { restaurantId } = ctx;

    const now = new Date();

    // Today range
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Yesterday range
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    // Fetch Today's & Yesterday's Paid Orders
    const [todayPaidOrders, yesterdayPaidOrders, restaurant] = await Promise.all([
      prisma.order.findMany({
        where: {
          restaurantId,
          paymentStatus: "PAID",
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        include: {
          orderItems: {
            select: { nameSnapshot: true, quantity: true, priceSnapshot: true },
          },
        },
      }),
      prisma.order.findMany({
        where: {
          restaurantId,
          paymentStatus: "PAID",
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        },
        select: { totalAmount: true },
      }),
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { name: true, currencySymbol: true },
      }),
    ]);

    const todayRevenue = todayPaidOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );
    const yesterdayRevenue = yesterdayPaidOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );

    // Calculate Growth %
    let growthPercent = 0;
    if (yesterdayRevenue > 0) {
      growthPercent = Number(
        (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)
      );
    } else if (todayRevenue > 0) {
      growthPercent = 100;
    }

    const totalOrdersCount = todayPaidOrders.length;
    const averageOrderValue =
      totalOrdersCount > 0
        ? Number((todayRevenue / totalOrdersCount).toFixed(2))
        : 0;

    // 7-Day Sales Trend (Last 7 days)
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const pastOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        paymentStatus: "PAID",
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true, totalAmount: true },
    });

    const dailySalesMap: Record<
      string,
      { date: string; dayName: string; revenue: number; orders: number }
    > = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
      dailySalesMap[key] = { date: key, dayName, revenue: 0, orders: 0 };
    }

    for (const order of pastOrders) {
      const key = order.createdAt.toISOString().split("T")[0];
      if (dailySalesMap[key]) {
        dailySalesMap[key].revenue += order.totalAmount;
        dailySalesMap[key].orders += 1;
      }
    }

    const dailySales = Object.values(dailySalesMap).map((d) => ({
      ...d,
      revenue: Number(d.revenue.toFixed(2)),
    }));

    // Top Selling Dishes (from all paid orders)
    const dishAgg: Record<
      string,
      { name: string; portions: number; revenue: number }
    > = {};

    for (const order of todayPaidOrders) {
      for (const item of order.orderItems) {
        if (!dishAgg[item.nameSnapshot]) {
          dishAgg[item.nameSnapshot] = {
            name: item.nameSnapshot,
            portions: 0,
            revenue: 0,
          };
        }
        dishAgg[item.nameSnapshot].portions += item.quantity;
        dishAgg[item.nameSnapshot].revenue +=
          item.priceSnapshot * item.quantity;
      }
    }

    const topDishes = Object.values(dishAgg)
      .sort((a, b) => b.portions - a.portions)
      .slice(0, 5);

    return NextResponse.json({
      currencySymbol: restaurant?.currencySymbol || "₹",
      kpi: {
        todayRevenue: Number(todayRevenue.toFixed(2)),
        yesterdayRevenue: Number(yesterdayRevenue.toFixed(2)),
        growthPercent,
        totalOrdersCount,
        averageOrderValue,
      },
      dailySales,
      topDishes,
    });
  } catch (err) {
    console.error("[/api/admin/sales error]:", err);
    return NextResponse.json(
      { error: "Failed to load sales analytics" },
      { status: 500 }
    );
  }
}
