/**
 * PATCH /api/super-admin/restaurants/[id]
 * Edit restaurant details OR toggle active/suspended status.
 * Also supports resetting the restaurant admin password.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  currencySymbol: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  googleReviewUrl: z.string().url().optional().or(z.literal("")),
  whatsappNumber: z.string().optional(),
  isActive: z.boolean().optional(),
  // For reset admin password
  newAdminPassword: z.string().min(6).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { newAdminPassword, ...restaurantData } = parsed.data;

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    // Update restaurant fields
    if (Object.keys(restaurantData).length > 0) {
      await tx.restaurant.update({
        where: { id },
        data: {
          ...restaurantData,
          logoUrl: restaurantData.logoUrl ?? undefined,
          googleReviewUrl: restaurantData.googleReviewUrl ?? undefined,
        },
      });
    }

    // Reset admin password if provided
    if (newAdminPassword) {
      const hash = await bcrypt.hash(newAdminPassword, 10);
      await tx.user.updateMany({
        where: { restaurantId: id, role: "RESTAURANT_ADMIN" },
        data: { passwordHash: hash },
      });
    }
  });

  const updated = await prisma.restaurant.findUnique({ where: { id } });
  return NextResponse.json({ ok: true, restaurant: updated });
}
