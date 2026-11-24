/**
 * app/[slug]/admin/availability/page.tsx
 * Admin Live Stock & Availability Management.
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AvailabilityView from "@/components/admin/AvailabilityView";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminAvailabilityPage({ params }: Props) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, currencySymbol: true, isActive: true },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  return (
    <AvailabilityView
      slug={slug}
      currencySymbol={restaurant.currencySymbol || "₹"}
    />
  );
}
