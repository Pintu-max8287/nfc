/**
 * app/[slug]/table/[tableNumber]/menu/page.tsx
 * Customer Digital Menu with Search, Category Tabs, Dish Details & Cart.
 */
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import MenuView from "@/components/customer/MenuView";

interface Props {
  params: Promise<{ slug: string; tableNumber: string }>;
}

export default async function CustomerMenuPage({ params }: Props) {
  const { slug, tableNumber } = await params;

  // 1. Verify restaurant
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      currencySymbol: true,
      taxRate: true,
      isActive: true,
    },
  });

  if (!restaurant || !restaurant.isActive) {
    return (
      <div className="mobile-shell flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-status-alert/10 text-status-alert flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-heading font-extrabold text-espresso">
          Restaurant Inactive
        </h1>
        <p className="text-sm text-muted mt-2 max-w-xs">
          This restaurant is not currently serving digital orders.
        </p>
        <Link href="/" className="btn-secondary mt-6 text-xs">
          DineFlow Home
        </Link>
      </div>
    );
  }

  // 2. Verify table
  const table = await prisma.table.findUnique({
    where: {
      restaurantId_tableNumber: {
        restaurantId: restaurant.id,
        tableNumber,
      },
    },
    select: {
      id: true,
      tableNumber: true,
      isActive: true,
    },
  });

  if (!table || !table.isActive) {
    return (
      <div className="mobile-shell flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-orange/10 text-orange flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-heading font-extrabold text-espresso">
          Table Invalid
        </h1>
        <p className="text-sm text-muted mt-2 max-w-xs">
          Please scan your table QR code again.
        </p>
        <Link
          href={`/${restaurant.slug}/table/01`}
          className="btn-primary mt-6 text-xs"
        >
          Go to Table 01
        </Link>
      </div>
    );
  }

  // 3. Load categories & menu items
  const [categories, menuItems] = await Promise.all([
    prisma.category.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        sortOrder: true,
      },
    }),
    prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: [{ categoryId: "asc" }, { name: "asc" }],
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        prepTime: true,
        spiceTag: true,
        dietaryTag: true,
        isAvailable: true,
        stockCount: true,
      },
    }),
  ]);

  return (
    <MenuView
      restaurant={restaurant}
      tableNumber={table.tableNumber}
      categories={categories}
      menuItems={menuItems}
    />
  );
}
