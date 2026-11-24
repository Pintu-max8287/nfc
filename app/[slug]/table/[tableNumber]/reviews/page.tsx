/**
 * app/[slug]/table/[tableNumber]/reviews/page.tsx
 * Dual Customer Review System:
 * - 1-5 Stars + Compliment Chips + Public Feed + Google Review Redirect
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReviewsView from "@/components/customer/ReviewsView";

interface Props {
  params: Promise<{ slug: string; tableNumber: string }>;
}

export default async function ReviewsPage({ params }: Props) {
  const { slug, tableNumber } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      googleReviewUrl: true,
      isActive: true,
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  return (
    <ReviewsView
      slug={slug}
      tableNumber={tableNumber}
      restaurant={{
        name: restaurant.name,
        googleReviewUrl: restaurant.googleReviewUrl,
      }}
    />
  );
}
