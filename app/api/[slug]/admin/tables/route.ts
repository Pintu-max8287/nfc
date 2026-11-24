/**
 * GET  /api/[slug]/admin/tables  — list tables
 * POST /api/[slug]/admin/tables  — add a table
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

const createSchema = z.object({
  tableNumber: z.string().min(1).max(5),
  capacity: z.number().int().min(1).max(50).default(4),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const tables = await prisma.table.findMany({
    where: { restaurantId },
    orderBy: { tableNumber: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json({ tables });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.table.findUnique({
    where: { restaurantId_tableNumber: { restaurantId, tableNumber: parsed.data.tableNumber } },
  });
  if (existing) {
    return NextResponse.json({ error: "Table number already exists" }, { status: 409 });
  }

  const table = await prisma.table.create({
    data: { restaurantId, tableNumber: parsed.data.tableNumber, capacity: parsed.data.capacity, isActive: true },
  });

  return NextResponse.json({ ok: true, table }, { status: 201 });
}
