/**
 * GET    /api/[slug]/admin/menu  — list categories + menu items
 * POST   /api/[slug]/admin/menu  — create menu item
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

const createItemSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  prepTime: z.string().optional(),
  spiceTag: z.string().optional(),
  dietaryTag: z.string().optional(),
  isAvailable: z.boolean().default(true),
  stockCount: z.number().int().nonnegative().nullable().optional(),
  lowStockThreshold: z.number().int().nonnegative().default(5),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const [categories, menuItems] = await Promise.all([
    prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: [{ categoryId: "asc" }, { name: "asc" }],
      include: { category: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({ categories, menuItems });
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
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  // Verify category belongs to this restaurant
  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, restaurantId },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const item = await prisma.menuItem.create({
    data: {
      restaurantId,
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      imageUrl: parsed.data.imageUrl || null,
      prepTime: parsed.data.prepTime,
      spiceTag: parsed.data.spiceTag,
      dietaryTag: parsed.data.dietaryTag,
      isAvailable: parsed.data.isAvailable,
      stockCount: parsed.data.stockCount ?? null,
      lowStockThreshold: parsed.data.lowStockThreshold,
    },
  });

  return NextResponse.json({ ok: true, item }, { status: 201 });
}
