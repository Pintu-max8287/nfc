"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Users,
  Plus,
  Trash2,
  ChefHat,
  UserCheck,
  Shield,
  X,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "KITCHEN_STAFF" | "WAITER";
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StaffView({ slug }: { slug: string }) {
  const { data, error, mutate, isLoading } = useSWR<{ staff: StaffMember[] }>(
    `/api/${slug}/admin/staff`,
    fetcher
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"KITCHEN_STAFF" | "WAITER">("KITCHEN_STAFF");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const staff = data?.staff || [];

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/${slug}/admin/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to create staff account");
      }

      setShowAddModal(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("KITCHEN_STAFF");
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error creating staff";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (userId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to remove staff account "${staffName}"?`))
      return;

    try {
      const res = await fetch(`/api/${slug}/admin/staff/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete staff member");
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error deleting staff";
      alert(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-espresso">
            Staff &amp; Role Management
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage Kitchen Staff and Floor Waiters authorized for this restaurant
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Staff Account</span>
        </button>
      </div>

      {/* Staff Login Information Callout */}
      <div className="card p-5 bg-surface border border-chestnut/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-orange/15 text-orange flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-xs text-espresso">
              Role-Based Multi-Tenant Access
            </h4>
            <p className="text-[11px] text-muted mt-0.5">
              Staff log in at{" "}
              <code className="text-orange font-bold">/admin/login</code>. Kitchen
              Staff are routed directly to the full-screen KDS (
              <code>/{slug}/kitchen</code>). Waiters receive live table alerts and
              can serve tickets.
            </p>
          </div>
        </div>

        <a
          href="/admin/login"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 shrink-0 self-start md:self-center"
        >
          <span>Open Staff Login</span>
          <ExternalLink className="w-3.5 h-3.5 text-orange" />
        </a>
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <div className="card p-12 text-center text-xs text-muted">
          Loading staff accounts...
        </div>
      ) : error ? (
        <div className="card p-8 text-center text-xs text-status-alert font-bold">
          Failed to load staff list.
        </div>
      ) : staff.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-muted/40 mx-auto" />
          <p className="text-xs text-muted">
            No staff accounts found. Create accounts for your kitchen chefs and floor staff.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-chestnut/10">
            {staff.map((member) => (
              <div
                key={member.id}
                className="p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                      member.role === "KITCHEN_STAFF"
                        ? "bg-chestnut/15 text-chestnut"
                        : "bg-orange/15 text-orange"
                    }`}
                  >
                    {member.role === "KITCHEN_STAFF" ? (
                      <ChefHat className="w-5 h-5" />
                    ) : (
                      <UserCheck className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-extrabold text-sm text-espresso">
                        {member.name}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          member.role === "KITCHEN_STAFF"
                            ? "bg-chestnut/15 text-chestnut"
                            : "bg-orange/15 text-orange"
                        }`}
                      >
                        {member.role === "KITCHEN_STAFF"
                          ? "Kitchen Staff"
                          : "Floor Waiter"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted hidden sm:inline">
                    Added {new Date(member.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => handleDeleteStaff(member.id, member.name)}
                    className="p-2 rounded-xl text-muted/60 hover:text-status-alert hover:bg-status-alert/10 transition-colors"
                    title="Remove staff member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add Staff Modal ────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-chestnut/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange" />
                <h3 className="font-heading font-extrabold text-base text-espresso">
                  Add Staff Member
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted hover:text-espresso p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-status-alert/10 border border-status-alert/30 text-status-alert text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-espresso block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chef Marco / Ravi Waiter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>

              <div>
                <label className="font-bold text-espresso block mb-1">
                  Login Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>

              <div>
                <label className="font-bold text-espresso block mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>

              <div>
                <label className="font-bold text-espresso block mb-1">Role *</label>
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "KITCHEN_STAFF" | "WAITER")
                  }
                  className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso focus:outline-none focus:ring-1 focus:ring-orange"
                >
                  <option value="KITCHEN_STAFF">
                    Kitchen Staff (Live KDS Screen)
                  </option>
                  <option value="WAITER">Floor Waiter (Service Alerts)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-espresso"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
                >
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}