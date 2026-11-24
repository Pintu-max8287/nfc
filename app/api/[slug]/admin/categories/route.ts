/**
 * GET  /api/[slug]/admin/categories  — list categories
 * POST /api/[slug]/admin/categories  — create category
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

const createSchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const categories = await prisma.category.findMany({
    where: { restaurantId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { menuItems: true } } },
  });

  return NextResponse.json({ categories });
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

  // Auto-assign sortOrder if not provided
  const maxOrder = await prisma.category.aggregate({
    where: { restaurantId },
    _max: { sortOrder: true },
  });
  const sortOrder = parsed.data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1;

  const category = await prisma.category.create({
    data: { restaurantId, name: parsed.data.name, sortOrder },
  });

  return NextResponse.json({ ok: true, category }, { status: 201 });
}
