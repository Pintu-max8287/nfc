/**
 * PATCH  /api/[slug]/admin/menu/[itemId]  — update price, availability, stock, or any field
 * DELETE /api/[slug]/admin/menu/[itemId]  — delete menu item
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  prepTime: z.string().optional(),
  spiceTag: z.string().optional(),
  dietaryTag: z.string().optional(),
  isAvailable: z.boolean().optional(),
  stockCount: z.number().int().nonnegative().nullable().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> }
) {
  const { slug, itemId } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> }
) {
  const { slug, itemId } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  await prisma.menuItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
