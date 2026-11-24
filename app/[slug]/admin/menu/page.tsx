/**
 * app/[slug]/admin/menu/page.tsx
 * Admin Menu & Price Management.
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuView from "@/components/admin/MenuView";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminMenuPage({ params }: Props) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, currencySymbol: true, isActive: true },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  return (
    <MenuView
      slug={slug}
      currencySymbol={restaurant.currencySymbol || "₹"}
    />
  );
}
