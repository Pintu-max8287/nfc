/**
 * app/[slug]/admin/sales/page.tsx
 * Restaurant Owner Sales Analytics & Reports Page.
 */
import SalesAnalyticsView from "@/components/admin/SalesAnalyticsView";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminSalesPage({ params }: Props) {
  const { slug } = await params;
  return <SalesAnalyticsView slug={slug} />;
}
