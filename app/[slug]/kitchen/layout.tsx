/**
 * app/[slug]/kitchen/layout.tsx
 * Layout wrapper for kitchen display routes.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kitchen Display — DineFlow",
};

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
