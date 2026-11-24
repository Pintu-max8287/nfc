"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Utensils,
  BellRing,
  Wifi,
  Receipt,
  Star,
  Copy,
  Check,
  X,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface CustomerHomeProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
    wifiName: string | null;
    wifiPassword: string | null;
    googleReviewUrl: string | null;
  };
  tableNumber: string;
}

export default function CustomerHomeView({
  restaurant,
  tableNumber,
}: CustomerHomeProps) {
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [waiterLoading, setWaiterLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Check for active order in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        `dineflow_active_order_${restaurant.slug}_${tableNumber}`
      );
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orderId) {
          setActiveOrderId(parsed.orderId);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [restaurant.slug, tableNumber]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleRequestWaiter = async () => {
    if (waiterLoading) return;
    setWaiterLoading(true);
    try {
      const res = await fetch(
        `/api/public/${restaurant.slug}/service-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableNumber,
            type: "WAITER_CALL",
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Waiter notified! Staff will arrive shortly.");
      } else {
        showToast(data.error || "Failed to notify waiter. Please wave to staff.");
      }
    } catch {
      showToast("Network issue. Please wave to your server.");
    } finally {
      setWaiterLoading(false);
    }
  };

  const copyWifiPassword = async () => {
    if (!restaurant.wifiPassword) return;
    try {
      await navigator.clipboard.writeText(restaurant.wifiPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="mobile-shell flex flex-col justify-between">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-espresso text-cream px-4 py-3 rounded-2xl shadow-modal flex items-center gap-3 border border-chestnut/30 animate-in fade-in slide-in-from-top-4">
          <BellRing className="w-5 h-5 text-orange shrink-0 animate-bounce" />
          <p className="text-xs font-medium leading-tight flex-1">
            {toastMessage}
          </p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-muted hover:text-cream text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {/* Top Header */}
        <header className="flex items-center justify-between pt-2 pb-6 border-b border-chestnut/15">
          <div className="flex items-center gap-3">
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="w-12 h-12 rounded-2xl object-cover border border-chestnut/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-orange flex items-center justify-center text-white shadow-card">
                <Utensils className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-heading font-extrabold text-espresso leading-snug">
                {restaurant.name}
              </h1>
              <p className="text-xs text-muted">Dine-in Experience</p>
            </div>
          </div>

          {/* Table Badge */}
          <div className="bg-chestnut/15 border border-chestnut/30 text-chestnut px-3.5 py-1.5 rounded-full font-heading font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
            Table {tableNumber}
          </div>
        </header>

        {/* Welcome Hero Greeting */}
        <section className="my-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to your table
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-espresso">
            What would you like today?
          </h2>
          <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
            {restaurant.description ||
              "Browse our seasonal menu, place orders directly, and track your food in real time."}
          </p>
        </section>

        {/* Primary CTA: View Menu */}
        <div className="mb-6">
          <Link
            href={`/${restaurant.slug}/table/${tableNumber}/menu`}
            className="w-full btn-primary text-base py-4 flex items-center justify-center gap-3 shadow-card hover:shadow-card-hover"
          >
            <Utensils className="w-5 h-5" />
            <span>View Full Menu &amp; Order</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </Link>
        </div>

        {/* 2x2 Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* 1. Request Waiter */}
          <button
            onClick={handleRequestWaiter}
            disabled={waiterLoading}
            className="card p-4 flex flex-col items-start justify-between text-left transition-all active:scale-[0.98] hover:border-orange/40 group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center text-orange group-hover:bg-orange group-hover:text-white transition-colors">
              {waiterLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <BellRing className="w-5 h-5" />
              )}
            </div>
            <div className="mt-3">
              <span className="text-xs font-heading font-bold text-espresso block">
                Request Waiter
              </span>
              <span className="text-[11px] text-muted block mt-0.5">
                Staff calls at table
              </span>
            </div>
          </button>

          {/* 2. WiFi */}
          <button
            onClick={() => setShowWifiModal(true)}
            className="card p-4 flex flex-col items-start justify-between text-left transition-all active:scale-[0.98] hover:border-chestnut/40 group"
          >
            <div className="w-10 h-10 rounded-xl bg-chestnut/10 flex items-center justify-center text-chestnut group-hover:bg-chestnut group-hover:text-cream transition-colors">
              <Wifi className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <span className="text-xs font-heading font-bold text-espresso block">
                Free Guest Wi-Fi
              </span>
              <span className="text-[11px] text-muted block mt-0.5">
                {restaurant.wifiName || "Fast Internet"}
              </span>
            </div>
          </button>

          {/* 3. Request Bill */}
          <Link
            href={`/${restaurant.slug}/table/${tableNumber}/bill`}
            className="card p-4 flex flex-col items-start justify-between text-left transition-all active:scale-[0.98] hover:border-chestnut/40 group"
          >
            <div className="w-10 h-10 rounded-xl bg-chestnut/10 flex items-center justify-center text-chestnut group-hover:bg-chestnut group-hover:text-cream transition-colors">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <span className="text-xs font-heading font-bold text-espresso block">
                Request Bill
              </span>
              <span className="text-[11px] text-muted block mt-0.5">
                Itemized check &amp; pay
              </span>
            </div>
          </Link>

          {/* 4. Reviews */}
          <Link
            href={`/${restaurant.slug}/table/${tableNumber}/reviews`}
            className="card p-4 flex flex-col items-start justify-between text-left transition-all active:scale-[0.98] hover:border-orange/40 group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center text-orange group-hover:bg-orange group-hover:text-white transition-colors">
              <Star className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <span className="text-xs font-heading font-bold text-espresso block">
                Guest Reviews
              </span>
              <span className="text-[11px] text-muted block mt-0.5">
                Share your feedback
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Floating Active Order Tracker Banner if customer has placed an order */}
      {activeOrderId && (
        <div className="sticky bottom-4 mx-4 mb-2 z-40">
          <Link
            href={`/${restaurant.slug}/table/${tableNumber}/track/${activeOrderId}`}
            className="block p-3.5 rounded-2xl bg-espresso text-cream shadow-modal border border-orange/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange/20 flex items-center justify-center text-orange">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-heading font-bold text-cream">
                    Active Order in Progress
                  </p>
                  <p className="text-[11px] text-cream/70">
                    Tap to view live kitchen tracking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-orange text-xs font-bold">
                <span>Track</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-muted/80 border-t border-chestnut/10 mt-6">
        <p>Powered by DineFlow Smart QR System</p>
      </footer>

      {/* WiFi Modal */}
      {showWifiModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowWifiModal(false)}
        >
          <div
            className="w-full max-w-sm card p-6 bg-surface shadow-modal border border-chestnut/20 rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-chestnut">
                <Wifi className="w-5 h-5 text-orange" />
                <h3 className="font-heading font-bold text-base text-espresso">
                  Guest Wi-Fi Details
                </h3>
              </div>
              <button
                onClick={() => setShowWifiModal(false)}
                className="text-muted hover:text-espresso p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-2">
              <div className="bg-cream/70 p-3.5 rounded-2xl border border-chestnut/15">
                <span className="text-[11px] text-muted uppercase font-bold tracking-wider block">
                  Network Name (SSID)
                </span>
                <p className="text-sm font-heading font-bold text-espresso mt-0.5">
                  {restaurant.wifiName || "No guest WiFi configured"}
                </p>
              </div>

              <div className="bg-cream/70 p-3.5 rounded-2xl border border-chestnut/15 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted uppercase font-bold tracking-wider block">
                    Password
                  </span>
                  <p className="text-sm font-mono font-bold text-espresso mt-0.5">
                    {restaurant.wifiPassword || "None required / Open"}
                  </p>
                </div>
                {restaurant.wifiPassword && (
                  <button
                    onClick={copyWifiPassword}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-status-ready" />
                        <span className="text-status-ready">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowWifiModal(false)}
              className="w-full btn-primary mt-4 py-2.5 text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
