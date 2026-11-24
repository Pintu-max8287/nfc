/**
 * PATCH /api/restaurant/[slug]/service-requests/[requestId]
 * Resolves table assistance requests (WAITER_CALL / BILL_REQUEST).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

const patchSchema = z.object({
  status: z.enum(["RESOLVED", "PENDING"]).default("RESOLVED"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; requestId: string }> }
) {
  try {
    const { slug, requestId } = await params;

    let targetStatus = "RESOLVED";
    try {
      const body = await req.json();
      const parsed = patchSchema.safeParse(body);
      if (parsed.success) {
        targetStatus = parsed.data.status;
      }
    } catch {
      // Body is optional, defaults to RESOLVED
    }

    const ctx = await requireAdminForSlug(req, slug, [
      "RESTAURANT_ADMIN",
      "KITCHEN_STAFF",
      "WAITER",
      "SUPER_ADMIN",
    ]);

    if (!isTenantContext(ctx)) return ctx;
    const { restaurantId } = ctx;

    const request = await prisma.serviceRequest.findFirst({
      where: { id: requestId, restaurantId },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Service request not found" },
        { status: 404 }
      );
    }

    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: targetStatus as "RESOLVED" | "PENDING" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/restaurant/service-requests error]:", err);
    return NextResponse.json(
      { error: "Failed to resolve service request" },
      { status: 500 }
    );
  }
}
