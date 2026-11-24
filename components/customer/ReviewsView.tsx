"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageSquare,
  Sparkles,
  Calendar,
  UtensilsCrossed,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ReviewItem {
  id: string;
  rating: number;
  tags: string[];
  comment: string | null;
  createdAt: string;
  table: {
    tableNumber: string;
  };
}

interface ReviewsViewProps {
  slug: string;
  tableNumber: string;
  restaurant: {
    name: string;
    googleReviewUrl: string | null;
  };
}

export default function ReviewsView({
  slug,
  tableNumber,
  restaurant,
}: ReviewsViewProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Live SWR feed of public website reviews
  const { data, mutate } = useSWR(
    `/api/public/${slug}/reviews`,
    fetcher,
    { revalidateOnFocus: true }
  );

  const reviews: ReviewItem[] = data?.reviews || [];
  const avgRating = data?.avgRating ?? 5.0;
  const totalCount = data?.totalCount ?? 0;
  const googleReviewUrl = data?.googleReviewUrl || restaurant.googleReviewUrl;

  const complimentChips = [
    "Tasty food",
    "Fast service",
    "Great ambience",
    "Clean tables",
    "Friendly staff",
    "Generous portions",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/public/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber,
          rating,
          tags: selectedTags,
          comment,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        mutate(); // Refresh the live website feed
      }
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-shell pb-24">
      {/* ── Top Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-chestnut/15 px-4 py-3 flex items-center justify-between">
        <Link
          href={`/${slug}/table/${tableNumber}`}
          className="flex items-center gap-1.5 text-chestnut font-semibold text-xs p-1 rounded-xl hover:bg-chestnut/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Table {tableNumber}</span>
        </Link>
        <span className="font-heading font-extrabold text-sm text-espresso">
          Customer Reviews
        </span>
        <div className="w-6" />
      </header>

      <main className="p-4 space-y-6">
        {/* ── Thank You / Post-Submit Screen ──────────────────────── */}
        {submitted ? (
          <div className="card p-6 text-center space-y-4 border-2 border-orange/30 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-3xl bg-status-ready/15 text-status-ready flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-status-ready uppercase tracking-wider bg-status-ready/10 px-2.5 py-0.5 rounded-full">
                Review Published
              </span>
              <h2 className="text-xl font-heading font-extrabold text-espresso mt-2">
                Thank you for your feedback!
              </h2>
              <p className="text-xs text-muted mt-1 max-w-xs mx-auto leading-relaxed">
                Your review is now live on {restaurant.name}&apos;s customer
                feed.
              </p>
            </div>

            {/* High-Visibility Google Review Button */}
            {googleReviewUrl && (
              <div className="p-4 rounded-2xl bg-cream border border-orange/40 text-center space-y-2">
                <p className="text-xs font-bold text-espresso">
                  🌟 Would you also share this on Google?
                </p>
                <p className="text-[11px] text-muted">
                  A 5-star Google review helps other diners discover us!
                </p>
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-card"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>Review on Google &rarr;</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            )}

            <Link
              href={`/${slug}/table/${tableNumber}`}
              className="btn-secondary w-full py-2.5 text-xs block text-center"
            >
              Return to Table Home
            </Link>
          </div>
        ) : (
          /* ── Interactive Review Form ───────────────────────────── */
          <form
            onSubmit={handleSubmitReview}
            className="card p-6 space-y-5 border border-chestnut/20"
          >
            <div className="text-center">
              <span className="text-[11px] font-bold text-orange uppercase tracking-wider bg-orange/10 px-2.5 py-0.5 rounded-full">
                Table {tableNumber} Experience
              </span>
              <h1 className="text-xl font-heading font-extrabold text-espresso mt-2">
                Rate your meal today
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Tap the stars to score your dining experience
              </p>

              {/* 1-5 Star Interactive Selector */}
              <div className="flex justify-center items-center gap-2.5 my-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-125 active:scale-95 transition-transform"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-orange text-orange drop-shadow-sm"
                          : "text-chestnut/20 fill-transparent"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-heading font-extrabold text-espresso">
                {rating === 5
                  ? "⭐⭐⭐⭐⭐ Excellent!"
                  : rating === 4
                  ? "⭐⭐⭐⭐ Very Good"
                  : rating === 3
                  ? "⭐⭐⭐ Average"
                  : rating === 2
                  ? "⭐⭐ Needs Improvement"
                  : "⭐ Poor"}
              </span>
            </div>

            {/* Quick-Tap Compliment Chips */}
            <div>
              <label className="block text-xs font-heading font-bold text-espresso mb-2">
                What stood out? (Select compliment chips)
              </label>
              <div className="flex flex-wrap gap-2">
                {complimentChips.map((chip) => {
                  const isSelected = selectedTags.includes(chip);
                  return (
                    <button
                      type="button"
                      key={chip}
                      onClick={() => toggleTag(chip)}
                      className={`text-xs px-3.5 py-1.5 rounded-full border transition-all ${
                        isSelected
                          ? "bg-orange text-white border-orange shadow-sm font-bold scale-[1.02]"
                          : "bg-cream text-chestnut border-chestnut/20 hover:border-orange/40 font-medium"
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <label className="block text-xs font-heading font-bold text-espresso mb-1.5">
                Comments or Chef Compliments (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Tell us what you loved about the food, ambiance, or service..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-cream border border-chestnut/20 rounded-2xl p-3.5 text-xs text-espresso focus:outline-none focus:border-orange leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3.5 text-xs font-bold flex items-center justify-center gap-2 shadow-card"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Guest Review &bull; Table {tableNumber}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ── Live Website Reviews Feed ───────────────────────────── */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-chestnut/15">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange" />
              <h2 className="font-heading font-extrabold text-sm text-espresso">
                Live Website Reviews
              </h2>
            </div>
            <div className="flex items-center gap-1.5 bg-orange/10 px-2.5 py-1 rounded-full text-xs font-bold text-orange">
              <Star className="w-3.5 h-3.5 fill-orange text-orange" />
              <span>{avgRating.toFixed(1)} / 5.0</span>
              <span className="text-muted font-normal text-[11px]">
                ({totalCount})
              </span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="card p-8 text-center text-muted">
              <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No reviews published yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating
                              ? "fill-orange text-orange"
                              : "text-chestnut/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(rev.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {rev.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] bg-orange/10 text-orange font-bold px-2 py-0.5 rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {rev.comment && (
                    <p className="text-xs text-espresso leading-relaxed italic bg-cream/60 p-2.5 rounded-xl border border-chestnut/10">
                      &quot;{rev.comment}&quot;
                    </p>
                  )}

                  <p className="text-[10px] text-muted/80">
                    Verified Diner &bull; Table {rev.table.tableNumber}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
