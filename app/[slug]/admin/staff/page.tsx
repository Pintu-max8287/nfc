/**
 * app/[slug]/admin/staff/page.tsx
 * Admin Staff Management.
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StaffView from "@/components/admin/StaffView";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminStaffPage({ params }: Props) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, isActive: true },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  return <StaffView slug={slug} />;
}
