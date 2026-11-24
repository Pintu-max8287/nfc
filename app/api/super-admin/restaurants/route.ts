/**
 * GET  /api/super-admin/restaurants        — list all restaurants + KPI data
 * POST /api/super-admin/restaurants        — create restaurant + admin user + 5 tables (transaction)
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

// ─── Auth guard ───────────────────────────────────────────────────────────────
async function guardSuperAdmin(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const guard = await guardSuperAdmin(req);
  if (guard) return guard;

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: { role: "RESTAURANT_ADMIN" },
        select: { email: true, name: true },
        take: 1,
      },
      _count: { select: { orders: true } },
    },
  });

  // Platform KPIs
  const [totalOrders, revenueAgg, activeCount] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.restaurant.count({ where: { isActive: true } }),
  ]);

  return NextResponse.json({
    restaurants,
    kpi: {
      totalRestaurants: restaurants.length,
      activeRestaurants: activeCount,
      totalOrders,
      totalRevenue: revenueAgg._sum.totalAmount ?? 0,
    },
  });
}

// ─── POST — create restaurant ─────────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers and hyphens only"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  currencySymbol: z.string().default("₹"),
  taxRate: z.number().min(0).max(100).default(5),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  googleReviewUrl: z.string().url().optional().or(z.literal("")),
  whatsappNumber: z.string().optional(),
  // Admin user
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const guard = await guardSuperAdmin(req);
  if (guard) return guard;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;

  // Check slug uniqueness
  const existing = await prisma.restaurant.findUnique({ where: { slug: d.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  // Check admin email uniqueness
  const existingUser = await prisma.user.findUnique({ where: { email: d.adminEmail } });
  if (existingUser) {
    return NextResponse.json({ error: "Admin email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(d.adminPassword, 10);

  // Single Prisma transaction: restaurant + admin user + 5 default tables
  const result = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        name: d.name,
        slug: d.slug,
        logoUrl: d.logoUrl || null,
        description: d.description || null,
        currencySymbol: d.currencySymbol,
        taxRate: d.taxRate,
        wifiName: d.wifiName || null,
        wifiPassword: d.wifiPassword || null,
        googleReviewUrl: d.googleReviewUrl || null,
        whatsappNumber: d.whatsappNumber || null,
        isActive: true,
      },
    });

    const adminUser = await tx.user.create({
      data: {
        email: d.adminEmail,
        passwordHash,
        name: d.adminName,
        role: "RESTAURANT_ADMIN",
        restaurantId: restaurant.id,
      },
    });

    // 5 default tables
    await tx.table.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        restaurantId: restaurant.id,
        tableNumber: String(i + 1).padStart(2, "0"),
        capacity: 4,
        isActive: true,
      })),
    });

    return { restaurant, adminUser };
  });

  return NextResponse.json({ ok: true, restaurant: result.restaurant }, { status: 201 });
}
