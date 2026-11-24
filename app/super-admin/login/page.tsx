/**
 * app/super-admin/login/page.tsx
 * Dedicated Super Admin login page.
 */
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push(data.redirectTo || "/super-admin");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--brand-espresso)" }}>
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <UtensilsCrossed className="w-4 h-4" style={{ color: "var(--brand-orange)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--brand-orange)" }}>DineFlow</span>
          </div>
          <h1 className="text-2xl font-heading font-bold" style={{ color: "var(--brand-espresso)" }}>Super Admin Portal</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Platform-level access only</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-espresso)" }}>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="superadmin@dineflow.com"
                className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-all"
                style={{ backgroundColor: "var(--bg-cream)", borderColor: "var(--border-chestnut-20)", color: "var(--brand-espresso)" }}
                onFocus={e => (e.target.style.borderColor = "var(--brand-orange)")}
                onBlur={e => (e.target.style.borderColor = "var(--border-chestnut-20)")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-espresso)" }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm border outline-none transition-all"
                  style={{ backgroundColor: "var(--bg-cream)", borderColor: "var(--border-chestnut-20)", color: "var(--brand-espresso)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--brand-orange)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border-chestnut-20)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "var(--status-alert)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {loading ? "Signing in…" : "Sign In as Super Admin"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Restaurant staff?{" "}
          <Link href="/admin/login" className="font-semibold" style={{ color: "var(--brand-orange)" }}>
            Login here
          </Link>
        </p>
      </div>
    </main>
  );
}
