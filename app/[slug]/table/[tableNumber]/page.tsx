/**
 * app/[slug]/table/[tableNumber]/page.tsx
 * Customer QR Entry Screen.
 * Validates restaurant status and table validity before showing the customer home.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertCircle, UtensilsCrossed, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import CustomerHomeView from "@/components/customer/CustomerHomeView";

interface Props {
  params: Promise<{ slug: string; tableNumber: string }>;
}

export default async function CustomerTablePage({ params }: Props) {
  const { slug, tableNumber } = await params;

  // 1. Fetch restaurant
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      description: true,
      wifiName: true,
      wifiPassword: true,
      googleReviewUrl: true,
      isActive: true,
    },
  });

  // If restaurant doesn't exist or is suspended
  if (!restaurant || !restaurant.isActive) {
    return (
      <div className="mobile-shell flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-status-alert/10 text-status-alert flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-heading font-extrabold text-espresso">
          Restaurant Unavailable
        </h1>
        <p className="text-sm text-muted mt-2 max-w-xs leading-relaxed">
          {restaurant
            ? `"${restaurant.name}" is currently not accepting digital orders. Please speak with staff.`
            : `We could not find a restaurant with identifier "${slug}".`}
        </p>
        <Link href="/" className="btn-secondary mt-6 text-xs">
          Return to DineFlow Home
        </Link>
      </div>
    );
  }

  // 2. Fetch table
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

  // If table doesn't exist or is marked inactive
  if (!table || !table.isActive) {
    return (
      <div className="mobile-shell flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-orange/10 text-orange flex items-center justify-center mb-4">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-heading font-extrabold text-espresso">
          Table {tableNumber} Not Available
        </h1>
        <p className="text-sm text-muted mt-2 max-w-xs leading-relaxed">
          This table is not active in {restaurant.name}&apos;s seating plan. Please
          ask a waiter or scan the QR code located on your table again.
        </p>
        <div className="flex gap-3 mt-6">
          <Link
            href={`/${restaurant.slug}/table/01`}
            className="btn-primary text-xs"
          >
            Try Table 01
          </Link>
          <Link href="/" className="btn-secondary text-xs">
            DineFlow
          </Link>
        </div>
      </div>
    );
  }

  // Render valid customer experience
  return (
    <CustomerHomeView
      restaurant={restaurant}
      tableNumber={table.tableNumber}
    />
  );
}
