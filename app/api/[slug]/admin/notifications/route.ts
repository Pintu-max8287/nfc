/**
 * GET /api/[slug]/admin/notifications
 * Returns recent NotificationLog entries for this restaurant.
 * Displayed in the Admin Settings "Automation & Alert Logs" section.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const ctx = await requireAdminForSlug(req, slug);
    if (!isTenantContext(ctx)) return ctx;
    const { restaurantId } = ctx;

    const logs = await prisma.notificationLog.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (err) {
    console.error("[/api/admin/notifications error]:", err);
    return NextResponse.json(
      { error: "Failed to fetch notification logs" },
      { status: 500 }
    );
  }
}
