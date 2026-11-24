/**
 * app/[slug]/kitchen/page.tsx
 * High-Contrast Live Kitchen Display System (KDS).
 * Real-time 3-column Kanban board with live elapsed timers & sound alerts.
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import KDSView from "@/components/kitchen/KDSView";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function KitchenDisplayPage({ params }: Props) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  return (
    <KDSView
      slug={slug}
      initialRestaurantName={restaurant.name}
    />
  );
}
