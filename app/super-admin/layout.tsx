/**
 * app/super-admin/layout.tsx
 * Layout wrapper for super-admin routes — applies espresso dark background metadata hint.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin — DineFlow",
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
