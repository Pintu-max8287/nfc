/**
 * GET   /api/[slug]/admin/settings  — read restaurant settings
 * PATCH /api/[slug]/admin/settings  — update settings
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminForSlug, isTenantContext } from "@/lib/admin-guard";

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
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true, name: true, slug: true, logoUrl: true, description: true,
      currencySymbol: true, taxRate: true, wifiName: true, wifiPassword: true,
      googleReviewUrl: true, whatsappNumber: true, isActive: true, createdAt: true,
    },
  });

  return NextResponse.json({ restaurant });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(req, slug);
  if (!isTenantContext(ctx)) return ctx;
  const { restaurantId } = ctx;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      ...parsed.data,
      logoUrl: parsed.data.logoUrl ?? undefined,
      googleReviewUrl: parsed.data.googleReviewUrl ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, restaurant: updated });
}
