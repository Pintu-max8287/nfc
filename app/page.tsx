/**
 * app/page.tsx — DineFlow Platform Landing Page
 */
import Link from "next/link";
import { UtensilsCrossed, QrCode, Zap, ChefHat, BarChart3, Smartphone } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b" style={{ borderColor: "var(--border-chestnut-15)", backgroundColor: "rgba(253,251,212,0.92)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-orange)" }}>
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-heading font-bold" style={{ color: "var(--brand-espresso)" }}>DineFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/login" className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors" style={{ color: "var(--brand-chestnut)" }}>
              Restaurant Login
            </Link>
            <Link href="/super-admin/login" className="text-sm font-semibold px-4 py-2 rounded-xl border transition-colors" style={{ color: "var(--brand-espresso)", borderColor: "var(--border-chestnut-20)" }}>
              Super Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-6" style={{ backgroundColor: "rgba(192,88,0,0.1)", color: "var(--brand-orange)" }}>
          <Zap className="w-3.5 h-3.5" />
          Multi-Tenant QR Ordering SaaS
        </div>
        <h1 className="text-5xl sm:text-6xl font-heading font-extrabold leading-tight mb-6" style={{ color: "var(--brand-espresso)" }}>
          Your Restaurant,<br />
          <span style={{ color: "var(--brand-orange)" }}>Fully Digital.</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: "var(--text-muted)" }}>
          Scan. Order. Track. Pay. — End-to-end QR dine-in ordering with live kitchen display, automated billing, and WhatsApp alerts. Zero app install for customers.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/spice-roast/table/05" className="btn-primary text-base px-8 py-3.5">
            <QrCode className="w-5 h-5" />
            Try Live Demo — Table 05
          </Link>
          <Link href="/admin/login" className="btn-secondary text-base px-8 py-3.5">
            Restaurant Admin Login
          </Link>
        </div>
      </section>

      {/* ── Feature Grid ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: QrCode,     title: "Zero-Install QR Ordering",   body: "Customers scan a table QR, browse the menu, and place orders instantly — no app, no login." },
            { icon: ChefHat,    title: "Live Kitchen Display (KDS)",  body: "3-column Kanban board (NEW → PREPARING → READY) with real-time sync and elapsed timers for every ticket." },
            { icon: Smartphone, title: "4-Stage Order Tracker",       body: "Customers track their order live — Order Received, Preparing, Ready, Served — with a progress bar." },
            { icon: Zap,        title: "WhatsApp Alerts",             body: "Automated notifications for new orders, low-stock warnings, and daily sales reports via WhatsApp." },
            { icon: BarChart3,  title: "Sales Analytics",             body: "Daily revenue bar charts, KPI growth percentages, and payment-method breakdowns for owners." },
            { icon: UtensilsCrossed, title: "Multi-Tenant SaaS",      body: "One platform, unlimited restaurants. Each tenant is fully isolated with their own slug, menu, and staff." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6 group hover:shadow-card-hover transition-all duration-200">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors" style={{ backgroundColor: "rgba(192,88,0,0.1)" }}>
                <Icon className="w-5 h-5" style={{ color: "var(--brand-orange)" }} />
              </div>
              <h3 className="font-heading font-semibold text-base mb-2" style={{ color: "var(--brand-espresso)" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="border-t" style={{ borderColor: "var(--border-chestnut-15)", backgroundColor: "var(--surface-card)" }}>
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4" style={{ color: "var(--brand-espresso)" }}>Ready to go digital?</h2>
          <p className="mb-8" style={{ color: "var(--text-muted)" }}>
            Log in to the Super Admin portal to create and manage restaurants on the platform.
          </p>
          <Link href="/super-admin/login" className="btn-primary text-base px-8 py-3.5">
            Super Admin Portal →
          </Link>
        </div>
      </section>
    </main>
  );
}
