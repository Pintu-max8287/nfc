/**
 * GET  /api/[slug]/admin/overview  — KPI summary + recent orders + service requests
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeOrders,
    totalTables,
    staffCount,
    menuItemCount,
    recentOrders,
    serviceRequests,
  ] = await Promise.all([
    prisma.order.count({
      where: { restaurantId, createdAt: { gte: today }, status: { notIn: ["SERVED", "CANCELLED"] } },
    }),
    prisma.table.count({ where: { restaurantId, isActive: true } }),
    prisma.user.count({ where: { restaurantId, role: { in: ["KITCHEN_STAFF", "WAITER"] } } }),
    prisma.menuItem.count({ where: { restaurantId } }),
    prisma.order.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        table: { select: { tableNumber: true } },
        orderItems: { select: { nameSnapshot: true, quantity: true } },
      },
    }),
    prisma.serviceRequest.findMany({
      where: { restaurantId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { table: { select: { tableNumber: true } } },
    }),
  ]);

  return NextResponse.json({
    kpi: { activeOrders, totalTables, staffCount, menuItemCount },
    recentOrders,
    serviceRequests,
  });
}
