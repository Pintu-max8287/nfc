/**
 * app/super-admin/page.tsx
 * Super Admin Dashboard — KPI cards + Restaurant directory + Add New Restaurant modal.
 */
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed, Plus, LogOut, Building2, TrendingUp, ShoppingBag,
  IndianRupee, ToggleLeft, ToggleRight, Pencil, KeyRound, ExternalLink,
  Loader2, X, ChevronRight, ShieldCheck, AlertCircle, CheckCircle2
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Restaurant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  currencySymbol: string;
  taxRate: number;
  createdAt: string;
  users: { email: string; name: string }[];
  _count: { orders: number };
}

interface KPI {
  totalRestaurants: number;
  activeRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(192,88,0,0.12)" }}>
          <Icon className="w-4.5 h-4.5" style={{ color: "var(--brand-orange)" }} />
        </div>
      </div>
      <p className="text-2xl font-heading font-bold tabular-nums" style={{ color: "var(--brand-espresso)" }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--status-ready)" }}>{sub}</p>}
    </div>
  );
}

// ─── Add Restaurant Modal ─────────────────────────────────────────────────────
function AddRestaurantModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "", slug: "", logoUrl: "", description: "", currencySymbol: "₹",
    taxRate: 5, wifiName: "", wifiPassword: "", googleReviewUrl: "",
    whatsappNumber: "", adminName: "", adminEmail: "", adminPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string | number) {
    setForm(f => ({ ...f, [key]: val }));
    if (key === "name") setForm(f => ({ ...f, name: val as string, slug: slugify(val as string) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, taxRate: Number(form.taxRate) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create restaurant"); return; }
      onSuccess();
      onClose();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  const inputClass = "w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-all";
  const inputStyle = { backgroundColor: "var(--bg-cream)", borderColor: "var(--border-chestnut-20)", color: "var(--brand-espresso)" };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "var(--brand-orange)");
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "var(--border-chestnut-20)");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(56,36,13,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-modal overflow-hidden" style={{ backgroundColor: "var(--surface-card)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-chestnut-15)" }}>
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5" style={{ color: "var(--brand-orange)" }} />
            <h2 className="text-lg font-heading font-bold" style={{ color: "var(--brand-espresso)" }}>Add New Restaurant</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream transition-colors" style={{ color: "var(--text-muted)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Restaurant Info */}
          <div>
            <h3 className="text-sm font-heading font-semibold mb-3 pb-2 border-b" style={{ color: "var(--brand-chestnut)", borderColor: "var(--border-chestnut-15)" }}>Restaurant Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>Restaurant Name *</label>
                <input required className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.name} onChange={e => set("name", e.target.value)} placeholder="Spice & Roast" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>URL Slug *</label>
                <input required className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.slug} onChange={e => set("slug", slugify(e.target.value))} placeholder="spice-roast"
                  pattern="[a-z0-9-]+" title="Lowercase, numbers, hyphens only" />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>/{form.slug || "your-slug"}/table/01</p>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>Currency Symbol</label>
                <input className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.currencySymbol} onChange={e => set("currencySymbol", e.target.value)} placeholder="₹" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>Tax Rate (%)</label>
                <input type="number" min="0" max="100" step="0.1" className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.taxRate} onChange={e => set("taxRate", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>Logo URL</label>
                <input type="url" className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.logoUrl} onChange={e => set("logoUrl", e.target.value)} placeholder="https://..." />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>Wi-Fi SSID</label>
                <input className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.wifiName} onChange={e => set("wifiName", e.target.value)} placeholder="Restaurant_Guest" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>Wi-Fi Password</label>
                <input className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.wifiPassword} onChange={e => set("wifiPassword", e.target.value)} placeholder="wifi2024" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>WhatsApp Number</label>
                <input className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.whatsappNumber} onChange={e => set("whatsappNumber", e.target.value)} placeholder="+919876543210" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>Google Review URL</label>
                <input type="url" className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.googleReviewUrl} onChange={e => set("googleReviewUrl", e.target.value)} placeholder="https://g.page/r/.../review" />
              </div>
            </div>
          </div>

          {/* Admin Account */}
          <div>
            <h3 className="text-sm font-heading font-semibold mb-3 pb-2 border-b" style={{ color: "var(--brand-chestnut)", borderColor: "var(--border-chestnut-15)" }}>Initial Admin Account</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>Admin Name *</label>
                <input required className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.adminName} onChange={e => set("adminName", e.target.value)} placeholder="Restaurant Owner" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>Admin Email *</label>
                <input required type="email" className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.adminEmail} onChange={e => set("adminEmail", e.target.value)} placeholder="admin@restaurant.com" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-espresso)" }}>Admin Password *</label>
                <input required type="password" minLength={6} className={inputClass} style={inputStyle} onFocus={focus} onBlur={blur}
                  value={form.adminPassword} onChange={e => set("adminPassword", e.target.value)} placeholder="Min. 6 characters" />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "var(--status-alert)" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 text-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? "Creating…" : "Create Restaurant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reset Password Modal ──────────────────────────────────────────────────────
function ResetPasswordModal({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/super-admin/restaurants/${restaurant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newAdminPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setSuccess(true);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(56,36,13,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6 shadow-modal" style={{ backgroundColor: "var(--surface-card)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-base" style={{ color: "var(--brand-espresso)" }}>
            Reset Admin Password
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Resetting password for <strong style={{ color: "var(--brand-espresso)" }}>{restaurant.name}</strong><br />
          <span className="text-xs">{restaurant.users[0]?.email}</span>
        </p>
        {success ? (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: "rgba(46,125,50,0.1)", color: "var(--status-ready)" }}>
            <CheckCircle2 className="w-4 h-4" /> Password updated successfully
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required type="password" minLength={6} placeholder="New password (min 6 chars)" value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none"
              style={{ backgroundColor: "var(--bg-cream)", borderColor: "var(--border-chestnut-20)", color: "var(--brand-espresso)" }} />
            {error && <p className="text-sm" style={{ color: "var(--status-alert)" }}>{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm py-2.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Reset
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<Restaurant | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/restaurants");
      if (res.status === 403) { router.push("/super-admin/login"); return; }
      const data = await res.json();
      setRestaurants(data.restaurants || []);
      setKpi(data.kpi || null);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleActive(r: Restaurant) {
    setTogglingId(r.id);
    try {
      await fetch(`/api/super-admin/restaurants/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !r.isActive }),
      });
      await fetchData();
    } finally { setTogglingId(null); }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/super-admin/login");
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-cream)" }}>
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="admin-sidebar w-60 p-5 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-orange)" }}>
            <UtensilsCrossed className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-sm" style={{ color: "var(--bg-cream)" }}>DineFlow</span>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--brand-orange)" }}>
            <ShieldCheck className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">Super Admin</span>
          </div>
        </div>

        <div className="mt-auto absolute bottom-5 left-5 right-5">
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="flex-1 pl-60 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold" style={{ color: "var(--brand-espresso)" }}>Platform Overview</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Manage all restaurants on DineFlow</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm py-2.5 px-5">
            <Plus className="w-4 h-4" /> Add Restaurant
          </button>
        </div>

        {/* KPI Cards */}
        {kpi && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard icon={Building2}   label="Total Restaurants" value={kpi.totalRestaurants} />
            <KpiCard icon={TrendingUp}  label="Active Restaurants" value={kpi.activeRestaurants} sub={`${Math.round((kpi.activeRestaurants / (kpi.totalRestaurants || 1)) * 100)}% active`} />
            <KpiCard icon={ShoppingBag} label="Total Orders"       value={kpi.totalOrders.toLocaleString()} />
            <KpiCard icon={IndianRupee} label="Platform Revenue"   value={`₹${kpi.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} sub="Paid orders only" />
          </div>
        )}

        {/* Restaurant Table */}
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border-chestnut-15)" }}>
            <h2 className="font-heading font-semibold text-sm" style={{ color: "var(--brand-espresso)" }}>Restaurant Directory</h2>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{restaurants.length} total</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand-orange)" }} />
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No restaurants yet. Add your first one!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border-chestnut-15)" }}>
                    {["Restaurant", "Slug", "Admin Email", "Orders", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((r, idx) => (
                    <tr key={r.id} className="border-b transition-colors hover:bg-cream/60" style={{ borderColor: idx < restaurants.length - 1 ? "var(--border-chestnut-15)" : "transparent" }}>
                      <td className="px-6 py-4">
                        <p className="font-semibold" style={{ color: "var(--brand-espresso)" }}>{r.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Tax {r.taxRate}% · {r.currencySymbol}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/${r.slug}/table/01`} target="_blank" className="flex items-center gap-1 font-mono text-xs hover:underline" style={{ color: "var(--brand-chestnut)" }}>
                          /{r.slug} <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs" style={{ color: "var(--brand-espresso)" }}>{r.users[0]?.email || "—"}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.users[0]?.name || ""}</p>
                      </td>
                      <td className="px-6 py-4 tabular-nums" style={{ color: "var(--brand-espresso)" }}>
                        {r._count.orders}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(r)}
                          disabled={togglingId === r.id}
                          className="flex items-center gap-1.5 text-xs font-semibold transition-opacity"
                          style={{ color: r.isActive ? "var(--status-ready)" : "var(--status-alert)", opacity: togglingId === r.id ? 0.5 : 1 }}
                        >
                          {r.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          {r.isActive ? "Active" : "Suspended"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/${r.slug}/admin`} className="p-1.5 rounded-lg hover:bg-cream transition-colors" style={{ color: "var(--brand-chestnut)" }} title="Manage">
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                          <button onClick={() => setResetTarget(r)} className="p-1.5 rounded-lg hover:bg-cream transition-colors" style={{ color: "var(--text-muted)" }} title="Reset Admin Password">
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-cream transition-colors" style={{ color: "var(--text-muted)" }} title="Edit Restaurant">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showAddModal && (
        <AddRestaurantModal onClose={() => setShowAddModal(false)} onSuccess={fetchData} />
      )}
      {resetTarget && (
        <ResetPasswordModal restaurant={resetTarget} onClose={() => setResetTarget(null)} />
      )}
    </div>
  );
}
