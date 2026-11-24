/**
 * app/[slug]/table/[tableNumber]/track/[orderId]/page.tsx
 * Real-time Live Order Tracker with SWR polling every 3 seconds.
 */
import OrderTrackerView from "@/components/customer/OrderTrackerView";

interface Props {
  params: Promise<{ slug: string; tableNumber: string; orderId: string }>;
}

export default async function OrderTrackerPage({ params }: Props) {
  const { slug, tableNumber, orderId } = await params;

  return (
    <OrderTrackerView
      slug={slug}
      tableNumber={tableNumber}
      orderId={orderId}
    />
  );
}
