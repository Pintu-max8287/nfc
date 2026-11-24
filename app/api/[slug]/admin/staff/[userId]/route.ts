/**
 * DELETE /api/[slug]/admin/staff/[userId]  — remove staff member
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  const { slug, userId } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const user = await prisma.user.findFirst({
    where: { id: userId, restaurantId, role: { in: ["KITCHEN_STAFF", "WAITER"] } },
  });
  if (!user) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
