/**
 * GET /api/cron/daily-report
 * Vercel Cron scheduled endpoint (e.g. 21:00 UTC) protected by CRON_SECRET.
 * Calculates daily sales for each active restaurant and dispatches WhatsApp EOD report.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyDailyReport } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const urlSecret = req.nextUrl.searchParams.get("secret");

    // Verify secret
    const isAuthorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronSecret && urlSecret === cronSecret);

    if (!isAuthorized && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activeRestaurants = await prisma.restaurant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        currencySymbol: true,
        whatsappNumber: true,
      },
    });

    const results = [];

    for (const restaurant of activeRestaurants) {
      const orders = await prisma.order.findMany({
        where: {
          restaurantId: restaurant.id,
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { not: "CANCELLED" },
        },
        include: {
          orderItems: {
            select: { nameSnapshot: true, quantity: true },
          },
        },
      });

      const totalOrders = orders.length;
      const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");
      const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);

      // Calculate top selling dish
      const dishCounts: Record<string, number> = {};
      for (const order of orders) {
        for (const item of order.orderItems) {
          dishCounts[item.nameSnapshot] =
            (dishCounts[item.nameSnapshot] || 0) + item.quantity;
        }
      }

      let topDish: string | undefined;
      let maxCount = 0;
      for (const [name, count] of Object.entries(dishCounts)) {
        if (count > maxCount) {
          maxCount = count;
          topDish = `${name} (${count} sold)`;
        }
      }

      const dateStr = todayStart.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      await notifyDailyReport(restaurant, {
        dateStr,
        totalOrders,
        paidOrders: paidOrders.length,
        totalRevenue,
        topDish,
      });

      results.push({
        restaurant: restaurant.name,
        orders: totalOrders,
        revenue: totalRevenue,
      });
    }

    return NextResponse.json({
      ok: true,
      processed: activeRestaurants.length,
      results,
    });
  } catch (err) {
    console.error("[/api/cron/daily-report error]:", err);
    return NextResponse.json(
      { error: "Failed to generate daily report" },
      { status: 500 }
    );
  }
}
