/**
 * GET /api/public/[slug]/menu
 * Returns categorized menu items for public dine-in menu browsing.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        currencySymbol: true,
        taxRate: true,
        isActive: true,
      },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json(
        { error: "Restaurant not found or inactive" },
        { status: 404 }
      );
    }

    const [categories, menuItems] = await Promise.all([
      prisma.category.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.menuItem.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: [{ categoryId: "asc" }, { name: "asc" }],
      }),
    ]);

    return NextResponse.json({
      restaurant,
      categories,
      menuItems,
    });
  } catch (err) {
    console.error("[/api/public/menu error]:", err);
    return NextResponse.json(
      { error: "Failed to load menu" },
      { status: 500 }
    );
  }
}
