/**
 * DELETE /api/[slug]/admin/categories/[catId]  — delete category (only if no menu items)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; catId: string }> }
) {
  const { slug, catId } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const category = await prisma.category.findFirst({ where: { id: catId, restaurantId } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const itemCount = await prisma.menuItem.count({ where: { categoryId: catId } });
  if (itemCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${itemCount} menu item(s) still in this category` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id: catId } });
  return NextResponse.json({ ok: true });
}
