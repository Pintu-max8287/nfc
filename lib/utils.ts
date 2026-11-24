/**
 * lib/utils.ts — Shared utility helpers used across the app.
 */

/** Slugify a display name into a URL-safe slug */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Format a number as Indian Rupee */
export function formatCurrency(
  amount: number,
  symbol: string = "₹"
): string {
  return `${symbol}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format a Date to "DD MMM YYYY, HH:MM" */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Pad a number to a fixed width string (e.g. tableNumber "01") */
export function padStart(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

/** Generate a human-readable elapsed-time string from a Date */
export function elapsed(from: string | Date): string {
  const diff = Math.floor((Date.now() - new Date(from).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ${diff % 60}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
