/**
 * app/[slug]/table/[tableNumber]/bill/page.tsx
 * Digital Billing & 3-Mode Payments (Online, Cash at Table, Pay at Counter).
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerBillView from "@/components/customer/CustomerBillView";

interface Props {
  params: Promise<{ slug: string; tableNumber: string }>;
}

export default async function BillPage({ params }: Props) {
  const { slug, tableNumber } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      currencySymbol: true,
      taxRate: true,
      isActive: true,
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  const table = await prisma.table.findUnique({
    where: {
      restaurantId_tableNumber: {
        restaurantId: restaurant.id,
        tableNumber,
      },
    },
  });

  if (!table || !table.isActive) {
    notFound();
  }

  // Load active unpaid orders for this table
  const orders = await prisma.order.findMany({
    where: {
      restaurantId: restaurant.id,
      tableId: table.id,
      paymentStatus: "UNPAID",
      status: { not: "CANCELLED" },
    },
    include: {
      orderItems: {
        select: {
          id: true,
          nameSnapshot: true,
          priceSnapshot: true,
          quantity: true,
          notes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const subtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const taxAmount = orders.reduce((sum, o) => sum + o.taxAmount, 0);
  const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <CustomerBillView
      slug={slug}
      tableNumber={tableNumber}
      restaurant={restaurant}
      initialOrders={orders}
      initialSubtotal={subtotal}
      initialTaxAmount={taxAmount}
      initialTotalAmount={totalAmount}
    />
  );
}
