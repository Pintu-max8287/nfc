/**
 * GET /api/[slug]/admin/orders  — list orders (with pagination)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(req, slug, ["RESTAURANT_ADMIN", "KITCHEN_STAFF", "SUPER_ADMIN"]);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

  const where = {
    restaurantId,
    ...(status ? { status: status as "NEW" | "PREPARING" | "READY" | "SERVED" | "CANCELLED" } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        table: { select: { tableNumber: true } },
        orderItems: {
          include: { menuItem: { select: { name: true } } },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) });
}
