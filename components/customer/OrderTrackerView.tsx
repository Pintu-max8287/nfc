"use client";

import { useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  BellRing,
  Utensils,
  Receipt,
  PlusCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TrackerProps {
  slug: string;
  tableNumber: string;
  orderId: string;
}

export default function OrderTrackerView({
  slug,
  tableNumber,
  orderId,
}: TrackerProps) {
  // SWR polling every 3 seconds
  const { data, error, isLoading } = useSWR(
    `/api/public/${slug}/orders/${orderId}`,
    fetcher,
    { refreshInterval: 3000 }
  );

  const order = data?.order;

  // Calculate stage index (0 to 3)
  const currentStage = useMemo(() => {
    if (!order) return 0;
    switch (order.status) {
      case "NEW":
        return 0;
      case "PREPARING":
        return 1;
      case "READY":
        return 2;
      case "SERVED":
        return 3;
      case "CANCELLED":
        return -1;
      default:
        return 0;
    }
  }, [order]);

  // Stage steps config
  const stages = [
    {
      label: "Order Received",
      desc: "Sent to kitchen display",
      icon: CheckCircle2,
    },
    {
      label: "Preparing",
      desc: "Chef is crafting your meal",
      icon: ChefHat,
    },
    {
      label: "Ready",
      desc: "Plated & ready for pickup",
      icon: BellRing,
    },
    {
      label: "Served",
      desc: "Enjoy your meal!",
      icon: Utensils,
    },
  ];

  // Progress percentage
  const progressPercent = useMemo(() => {
    if (currentStage === -1) return 0;
    if (currentStage === 0) return 20;
    if (currentStage === 1) return 55;
    if (currentStage === 2) return 85;
    return 100;
  }, [currentStage]);

  if (isLoading && !order) {
    return (
      <div className="mobile-shell flex flex-col items-center justify-center min-h-screen p-6">
        <Loader2 className="w-8 h-8 animate-spin text-orange mb-3" />
        <p className="text-xs font-heading font-bold text-espresso">
          Connecting to live kitchen feed...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mobile-shell flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertCircle className="w-10 h-10 text-status-alert mb-3" />
        <h2 className="text-base font-heading font-bold text-espresso">
          Order Not Found
        </h2>
        <p className="text-xs text-muted mt-1 max-w-xs">
          We could not load this order tracker. Please check with your server.
        </p>
        <Link
          href={`/${slug}/table/${tableNumber}`}
          className="btn-primary mt-4 text-xs"
        >
          Return to Table
        </Link>
      </div>
    );
  }

  return (
    <div className="mobile-shell pb-20">
      {/* ── Top Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-chestnut/15 px-4 py-3 flex items-center justify-between">
        <Link
          href={`/${slug}/table/${tableNumber}`}
          className="flex items-center gap-1.5 text-chestnut font-semibold text-xs p-1 rounded-xl hover:bg-chestnut/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Table {tableNumber}</span>
        </Link>
        <span className="font-heading font-extrabold text-sm text-espresso">
          Live Order Tracker
        </span>
        <div className="w-6" /> {/* Balance spacer */}
      </header>

      <main className="p-4 space-y-4">
        {/* ── Order Title Card ───────────────────────────────────── */}
        <div className="card p-5 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Order #{order.orderNumber}
          </div>

          <h1 className="text-xl font-heading font-extrabold text-espresso">
            Table {tableNumber}
          </h1>

          <p className="text-xs text-muted mt-1">
            Placed at{" "}
            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {/* Cancelled Banner */}
          {order.status === "CANCELLED" && (
            <div className="bg-status-alert/10 text-status-alert text-xs font-bold p-3 rounded-xl mt-3">
              This order has been cancelled by the kitchen.
            </div>
          )}
        </div>

        {/* ── 4-Stage Progress Stepper ───────────────────────────── */}
        {order.status !== "CANCELLED" && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-heading font-bold text-espresso">
                Live Kitchen Status
              </span>
              <span className="text-xs text-orange font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange animate-ping" />
                {order.status}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-cream h-2 rounded-full overflow-hidden mb-6 border border-chestnut/15">
              <div
                className="bg-orange h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 4 Stage Steps */}
            <div className="space-y-4">
              {stages.map((stage, idx) => {
                const Icon = stage.icon;
                const isPassed = idx < currentStage;
                const isCurrent = idx === currentStage;

                return (
                  <div key={stage.label} className="flex items-start gap-3.5">
                    {/* Step Icon */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        isCurrent
                          ? "bg-orange text-white ring-4 ring-orange/20 animate-pulse"
                          : isPassed
                          ? "bg-status-ready text-white"
                          : "bg-cream text-muted/50 border border-chestnut/20"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-heading font-bold ${
                            isCurrent
                              ? "text-orange"
                              : isPassed
                              ? "text-espresso"
                              : "text-muted/60"
                          }`}
                        >
                          {stage.label}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] bg-orange/15 text-orange px-2 py-0.5 rounded-full font-bold">
                            In Progress
                          </span>
                        )}
                        {isPassed && (
                          <span className="text-[10px] text-status-ready font-bold">
                            Done &check;
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Itemized Order Summary ─────────────────────────────── */}
        <div className="card p-5">
          <h2 className="text-xs font-heading font-bold text-espresso uppercase tracking-wider mb-3">
            Itemized Order ({order.orderItems.length} items)
          </h2>

          <div className="divide-y divide-chestnut/10">
            {order.orderItems.map((item: { id: string; nameSnapshot: string; quantity: number; priceSnapshot: number; notes?: string | null }) => (
              <div key={item.id} className="py-2.5 flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-espresso">
                    {item.nameSnapshot}
                    <span className="text-orange ml-1 font-semibold">
                      &times; {item.quantity}
                    </span>
                  </p>
                  {item.notes && (
                    <p className="text-[10px] text-muted italic mt-0.5">
                      Note: &quot;{item.notes}&quot;
                    </p>
                  )}
                </div>
                <span className="text-xs font-bold text-espresso tabular-nums">
                  {order.restaurant.currencySymbol}
                  {(item.priceSnapshot * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="mt-3 pt-3 border-t border-chestnut/15 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">
                {order.restaurant.currencySymbol}
                {order.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Tax ({order.restaurant.taxRate}%)</span>
              <span className="tabular-nums">
                {order.restaurant.currencySymbol}
                {order.taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-heading font-extrabold text-sm text-espresso pt-1.5 border-t border-chestnut/10">
              <span>Total Amount</span>
              <span className="text-orange tabular-nums">
                {order.restaurant.currencySymbol}
                {order.totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Payment Status Badge */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-muted">Payment</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  order.paymentStatus === "PAID"
                    ? "bg-green-100 text-status-ready"
                    : "bg-orange/10 text-orange"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* ── Quick Action Buttons ───────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Link
            href={`/${slug}/table/${tableNumber}/menu`}
            className="btn-secondary py-3 text-xs flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-orange" />
            <span>Order More</span>
          </Link>

          <Link
            href={`/${slug}/table/${tableNumber}/bill`}
            className="btn-primary py-3 text-xs flex items-center justify-center gap-1.5"
          >
            <Receipt className="w-4 h-4" />
            <span>View Bill &amp; Pay</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
