/**
 * GET  /api/public/[slug]/reviews — Returns public website reviews feed
 * POST /api/public/[slug]/reviews — Submits customer review & rating
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true, name: true, googleReviewUrl: true, isActive: true },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        restaurantId: restaurant.id,
        isPublic: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        table: { select: { tableNumber: true } },
      },
    });

    const totalCount = reviews.length;
    const avgRating =
      totalCount > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1))
        : 5.0;

    return NextResponse.json({
      restaurantName: restaurant.name,
      googleReviewUrl: restaurant.googleReviewUrl,
      avgRating,
      totalCount,
      reviews,
    });
  } catch (err) {
    console.error("[/api/public/reviews GET error]:", err);
    return NextResponse.json(
      { error: "Failed to load reviews" },
      { status: 500 }
    );
  }
}

const reviewSchema = z.object({
  tableNumber: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.string()).default([]),
  comment: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid review data", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tableNumber, rating, tags, comment } = parsed.data;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true, googleReviewUrl: true, isActive: true },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json(
        { error: "Restaurant not found or inactive" },
        { status: 404 }
      );
    }

    const table = await prisma.table.findUnique({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber,
        },
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const review = await prisma.review.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        rating,
        tags,
        comment: comment || null,
        isPublic: true,
      },
    });

    return NextResponse.json({
      ok: true,
      reviewId: review.id,
      googleReviewUrl: restaurant.googleReviewUrl,
    });
  } catch (err) {
    console.error("[/api/public/reviews POST error]:", err);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
