/**
 * app/[slug]/admin/settings/page.tsx
 * Admin Settings, Wi-Fi, WhatsApp Alert Number & Automation Logs.
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsView from "@/components/admin/SettingsView";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminSettingsPage({ params }: Props) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      currencySymbol: true,
      taxRate: true,
      wifiName: true,
      wifiPassword: true,
      googleReviewUrl: true,
      whatsappNumber: true,
      isActive: true,
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  return (
    <SettingsView
      slug={slug}
      initialRestaurant={restaurant}
    />
  );
}
