"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Settings,
  Bell,
  Wifi,
  Percent,
  Phone,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Send,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SettingsViewProps {
  slug: string;
  initialRestaurant: {
    id: string;
    name: string;
    currencySymbol: string;
    taxRate: number;
    wifiName: string | null;
    wifiPassword: string | null;
    googleReviewUrl: string | null;
    whatsappNumber: string | null;
  };
}

interface NotificationLogItem {
  id: string;
  type: "NEW_ORDER" | "LOW_STOCK" | "DAILY_REPORT";
  recipient: string;
  message: string;
  status: "SENT" | "SIMULATED" | "FAILED";
  createdAt: string;
}

export default function SettingsView({
  slug,
  initialRestaurant,
}: SettingsViewProps) {
  const [form, setForm] = useState(initialRestaurant);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // SWR for notification logs
  const { data: logsData, mutate: mutateLogs } = useSWR(
    `/api/${slug}/admin/notifications`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const logs: NotificationLogItem[] = logsData?.logs || [];

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch(`/api/${slug}/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          currencySymbol: form.currencySymbol,
          taxRate: Number(form.taxRate),
          wifiName: form.wifiName,
          wifiPassword: form.wifiPassword,
          googleReviewUrl: form.googleReviewUrl,
          whatsappNumber: form.whatsappNumber,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const json = await res.json();
        setSaveError(json.error || "Failed to update settings");
      }
    } catch {
      setSaveError("Network error updating settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-espresso">
          Restaurant Settings &amp; Automation
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Configure tax, guest Wi-Fi, WhatsApp alert triggers, and inspect
          dispatch logs
        </p>
      </div>

      {/* ── Settings Form ───────────────────────────────────────── */}
      <form onSubmit={handleSaveSettings} className="card p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange" />
            <h2 className="font-heading font-extrabold text-sm text-espresso">
              General Configuration
            </h2>
          </div>
          {saveSuccess && (
            <span className="text-xs text-status-ready font-bold flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved!
            </span>
          )}
        </div>

        {saveError && (
          <div className="p-3 bg-status-alert/10 text-status-alert text-xs rounded-xl border border-status-alert/20 font-bold">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-espresso mb-1">
              Restaurant Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-cream border border-chestnut/20 rounded-xl px-3.5 py-2 text-xs text-espresso focus:outline-none focus:border-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-espresso mb-1">
              Currency Symbol
            </label>
            <input
              type="text"
              required
              value={form.currencySymbol}
              onChange={(e) =>
                setForm({ ...form, currencySymbol: e.target.value })
              }
              className="w-full bg-cream border border-chestnut/20 rounded-xl px-3.5 py-2 text-xs text-espresso focus:outline-none focus:border-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-espresso mb-1">
              Sales Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              value={form.taxRate}
              onChange={(e) =>
                setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-cream border border-chestnut/20 rounded-xl px-3.5 py-2 text-xs text-espresso focus:outline-none focus:border-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-espresso mb-1">
              WhatsApp Alert Phone Number
            </label>
            <input
              type="text"
              placeholder="+919876543210"
              value={form.whatsappNumber || ""}
              onChange={(e) =>
                setForm({ ...form, whatsappNumber: e.target.value })
              }
              className="w-full bg-cream border border-chestnut/20 rounded-xl px-3.5 py-2 text-xs text-espresso focus:outline-none focus:border-orange"
            />
            <p className="text-[10px] text-muted mt-1">
              Used for New Order, Low Stock &amp; EOD Daily Sales WhatsApp
              alerts
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-espresso mb-1">
              Guest Wi-Fi Network (SSID)
            </label>
            <input
              type="text"
              placeholder="e.g. SpiceRoast_Guest"
              value={form.wifiName || ""}
              onChange={(e) => setForm({ ...form, wifiName: e.target.value })}
              className="w-full bg-cream border border-chestnut/20 rounded-xl px-3.5 py-2 text-xs text-espresso focus:outline-none focus:border-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-espresso mb-1">
              Guest Wi-Fi Password
            </label>
            <input
              type="text"
              placeholder="e.g. spice2024"
              value={form.wifiPassword || ""}
              onChange={(e) =>
                setForm({ ...form, wifiPassword: e.target.value })
              }
              className="w-full bg-cream border border-chestnut/20 rounded-xl px-3.5 py-2 text-xs text-espresso focus:outline-none focus:border-orange"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-espresso mb-1">
              Google Review URL
            </label>
            <input
              type="url"
              placeholder="https://g.page/r/.../review"
              value={form.googleReviewUrl || ""}
              onChange={(e) =>
                setForm({ ...form, googleReviewUrl: e.target.value })
              }
              className="w-full bg-cream border border-chestnut/20 rounded-xl px-3.5 py-2 text-xs text-espresso focus:outline-none focus:border-orange"
            />
            <p className="text-[10px] text-muted mt-1">
              Direct link surfaced to diners on the Thank-You screen to collect
              5-star Google Reviews
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </form>

      {/* ── Automation & Alert Logs Section ─────────────────────── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange" />
            <div>
              <h2 className="font-heading font-extrabold text-sm text-espresso">
                Automation &amp; WhatsApp Alert Logs
              </h2>
              <p className="text-[11px] text-muted">
                Audit trail for New Order, Low Stock &amp; Daily EOD Report
                dispatches
              </p>
            </div>
          </div>
          <span className="text-xs text-muted font-mono">
            {logs.length} Logged Entries
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-10 text-muted">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No alerts have been dispatched yet.</p>
            <p className="text-[11px] text-muted/70 mt-0.5">
              Alerts will appear here when orders are placed or stock runs low.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-chestnut/10 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="py-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Alert Type Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.type === "NEW_ORDER"
                          ? "bg-orange/15 text-orange"
                          : log.type === "LOW_STOCK"
                          ? "bg-status-alert/15 text-status-alert"
                          : "bg-chestnut/15 text-chestnut"
                      }`}
                    >
                      {log.type === "NEW_ORDER"
                        ? "🔔 New Order"
                        : log.type === "LOW_STOCK"
                        ? "⚠️ Low Stock"
                        : "📊 Daily Report"}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.status === "SENT"
                          ? "bg-status-ready/15 text-status-ready"
                          : log.status === "SIMULATED"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.status === "SENT"
                        ? "✓ WhatsApp Sent"
                        : log.status === "SIMULATED"
                        ? "Simulated"
                        : "Failed"}
                    </span>
                  </div>

                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <p className="text-espresso font-medium whitespace-pre-line leading-relaxed bg-cream/70 p-2.5 rounded-xl border border-chestnut/10 font-mono text-[11px]">
                  {log.message}
                </p>

                <p className="text-[10px] text-muted">
                  Recipient: <span className="font-bold">{log.recipient}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
