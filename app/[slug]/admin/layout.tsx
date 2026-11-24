/**
 * app/[slug]/admin/layout.tsx
 * Admin layout shell with #38240D Deep Espresso sidebar, top bar, and live kitchen shortcut.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  UtensilsCrossed,
  ChefHat,
  BarChart3,
  Settings,
  LayoutDashboard,
  LogOut,
  ExternalLink,
  CheckCircle2,
  QrCode,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, slug: true, isActive: true },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  const navLinks = [
    {
      label: "Overview",
      href: `/${slug}/admin`,
      icon: LayoutDashboard,
    },
    {
      label: "Menu & Prices",
      href: `/${slug}/admin/menu`,
      icon: UtensilsCrossed,
    },
    {
      label: "Availability & Stock",
      href: `/${slug}/admin/availability`,
      icon: CheckCircle2,
    },
    {
      label: "Tables & QRs",
      href: `/${slug}/admin/tables`,
      icon: QrCode,
    },
    {
      label: "Staff Accounts",
      href: `/${slug}/admin/staff`,
      icon: Users,
    },
    {
      label: "Live Kitchen (KDS)",
      href: `/${slug}/kitchen`,
      icon: ChefHat,
      badge: "Live",
    },
    {
      label: "Sales Analytics",
      href: `/${slug}/admin/sales`,
      icon: BarChart3,
    },
    {
      label: "Settings & Logs",
      href: `/${slug}/admin/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-cream flex">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-64 bg-espresso text-cream flex flex-col justify-between shrink-0 border-r border-chestnut/30 hidden md:flex">
        <div>
          {/* Logo & Brand */}
          <div className="p-6 border-b border-chestnut/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange flex items-center justify-center text-white">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-sm text-cream leading-tight">
                  {restaurant.name}
                </h2>
                <span className="text-[10px] text-cream/60">Admin Portal</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-cream/80 hover:text-white hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-orange group-hover:scale-110 transition-transform" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-orange text-white px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-chestnut/30 space-y-2">
          <Link
            href={`/${slug}/table/01`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-cream/70 hover:text-cream bg-white/5 transition-colors"
          >
            <span>Preview Table 01</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-cream/90 backdrop-blur-md border-b border-chestnut/15 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="font-heading font-extrabold text-base text-espresso">
              {restaurant.name}
            </h2>
            <span className="text-[10px] bg-chestnut/15 text-chestnut font-bold px-2.5 py-0.5 rounded-full hidden sm:inline">
              Multi-Tenant Isolated
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${slug}/kitchen`}
              className="btn-primary py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <ChefHat className="w-4 h-4" />
              <span>Launch KDS</span>
            </Link>

            <Link
              href="/admin/login"
              className="text-xs font-bold text-muted hover:text-espresso p-2 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Workspace Canvas */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
