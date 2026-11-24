/**
 * app/admin/login/page.tsx
 * Unified login for Restaurant Admin & Kitchen Staff.
 * Routes to /[slug]/admin or /[slug]/kitchen based on role.
 */
"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UtensilsCrossed, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

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

      router.push(callbackUrl || data.redirectTo || "/");
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
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--brand-orange)" }}>
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold" style={{ color: "var(--brand-espresso)" }}>Restaurant Login</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Admin &amp; Kitchen Staff</p>
        </div>

        {/* Demo hint */}
        <div className="mb-5 rounded-xl px-4 py-3 text-xs" style={{ backgroundColor: "rgba(192,88,0,0.08)", color: "var(--brand-chestnut)" }}>
          <p className="font-semibold mb-1">Demo credentials</p>
          <p>Admin: <code className="font-mono">admin@spiceroast.com</code> / <code className="font-mono">Admin@123</code></p>
          <p>Kitchen: <code className="font-mono">kitchen@spiceroast.com</code> / <code className="font-mono">Kitchen@123</code></p>
        </div>

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
                placeholder="admin@yourrestaurant.com"
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UtensilsCrossed className="w-4 h-4" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Super Admin?{" "}
          <Link href="/super-admin/login" className="font-semibold" style={{ color: "var(--brand-orange)" }}>
            Admin portal →
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><div className="w-8 h-8 rounded-xl animate-pulse" style={{ backgroundColor: "var(--brand-orange)" }} /></div>}>
      <LoginForm />
    </Suspense>
  );
}
