/**
 * app/[slug]/admin/tables/page.tsx
 * Admin Tables & Dynamic QR Code Studio.
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TablesView from "@/components/admin/TablesView";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminTablesPage({ params }: Props) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      name: true,
      wifiName: true,
      wifiPassword: true,
      isActive: true,
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  return <TablesView slug={slug} restaurant={restaurant} />;
}
