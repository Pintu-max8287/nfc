/**
 * DELETE /api/[slug]/admin/tables/[tableId]  — deactivate/remove a table
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; tableId: string }> }
) {
  const { slug, tableId } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const table = await prisma.table.findFirst({ where: { id: tableId, restaurantId } });
  if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

  // Soft-delete: mark inactive (preserve order history)
  await prisma.table.update({ where: { id: tableId }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
