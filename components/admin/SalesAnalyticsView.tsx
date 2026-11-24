"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  IndianRupee,
  UtensilsCrossed,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SalesViewProps {
  slug: string;
}

export default function SalesAnalyticsView({ slug }: SalesViewProps) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/${slug}/admin/sales`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportResult, setReportResult] = useState<string | null>(null);

  const kpi = data?.kpi;
  const dailySales = data?.dailySales || [];
  const topDishes = data?.topDishes || [];
  const currency = data?.currencySymbol || "₹";

  const handleSendReportNow = async () => {
    if (isSendingReport) return;
    setIsSendingReport(true);
    setReportResult(null);

    try {
      const res = await fetch(`/api/${slug}/admin/sales/send-report`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        setReportResult(
          json.message || "Daily report dispatched to owner WhatsApp!"
        );
      } else {
        setReportResult(json.error || "Failed to dispatch report.");
      }
    } catch {
      setReportResult("Network error dispatching report.");
    } finally {
      setIsSendingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  if (error || !kpi) {
    return (
      <div className="card p-8 text-center my-6">
        <AlertCircle className="w-10 h-10 text-status-alert mx-auto mb-2" />
        <h2 className="text-base font-heading font-bold text-espresso">
          Failed to load sales data
        </h2>
        <p className="text-xs text-muted mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  const isPositiveGrowth = kpi.growthPercent >= 0;

  return (
    <div className="space-y-6">
      {/* ── Top Header & Report Trigger ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-espresso">
            Sales &amp; Revenue Analytics
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Real-time daily GMV, growth metrics, and portion popularity
          </p>
        </div>

        <button
          onClick={handleSendReportNow}
          disabled={isSendingReport}
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 shrink-0 shadow-sm"
        >
          {isSendingReport ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Send Today&apos;s Report Now (WhatsApp)</span>
        </button>
      </div>

      {/* Report Dispatch Alert Toast */}
      {reportResult && (
        <div className="p-3.5 rounded-2xl bg-orange/10 border border-orange/30 text-xs font-bold text-orange flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{reportResult}</span>
          </div>
          <button
            onClick={() => setReportResult(null)}
            className="text-muted hover:text-espresso"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── 4 KPI Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">
              Today&apos;s Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange/15 text-orange flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-heading font-extrabold text-espresso tabular-nums">
            {currency}
            {kpi.todayRevenue.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-[11px] text-muted mt-1">Paid dine-in orders</p>
        </div>

        {/* Growth vs Yesterday */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">
              Growth vs. Yesterday
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isPositiveGrowth
                  ? "bg-green-100 text-status-ready"
                  : "bg-red-100 text-status-alert"
              }`}
            >
              {isPositiveGrowth ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
          </div>
          <p
            className={`text-2xl font-heading font-extrabold tabular-nums ${
              isPositiveGrowth ? "text-status-ready" : "text-status-alert"
            }`}
          >
            {isPositiveGrowth ? `+${kpi.growthPercent}%` : `${kpi.growthPercent}%`}
          </p>
          <p className="text-[11px] text-muted mt-1">
            Yesterday: {currency}
            {kpi.yesterdayRevenue.toFixed(2)}
          </p>
        </div>

        {/* Paid Orders Today */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">
              Paid Orders Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-chestnut/15 text-chestnut flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-heading font-extrabold text-espresso tabular-nums">
            {kpi.totalOrdersCount}
          </p>
          <p className="text-[11px] text-muted mt-1">Completed table bills</p>
        </div>

        {/* Average Order Value */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">
              Average Order Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange/15 text-orange flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-heading font-extrabold text-espresso tabular-nums">
            {currency}
            {kpi.averageOrderValue.toFixed(2)}
          </p>
          <p className="text-[11px] text-muted mt-1">Per paying table</p>
        </div>
      </div>

      {/* ── 7-Day Sales Bar Chart (Recharts) ──────────────────────── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange" />
            <h2 className="font-heading font-extrabold text-sm text-espresso">
              Daily Sales Trend (Last 7 Days)
            </h2>
          </div>
          <span className="text-[11px] text-muted font-mono">
            {dailySales.length} Days Recorded
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailySales}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(113, 54, 0, 0.12)"
                vertical={false}
              />
              <XAxis
                dataKey="dayName"
                tick={{ fill: "#6E5438", fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: "rgba(113, 54, 0, 0.2)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6E5438", fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: "rgba(113, 54, 0, 0.2)" }}
                tickLine={false}
                tickFormatter={(val) => `${currency}${val}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-espresso text-cream p-3 rounded-2xl shadow-modal text-xs border border-chestnut/40 space-y-1">
                        <p className="font-heading font-extrabold text-orange">
                          {dataPoint.dayName} &bull; {dataPoint.date}
                        </p>
                        <p className="font-bold">
                          Revenue: {currency}
                          {Number(payload[0].value).toFixed(2)}
                        </p>
                        <p className="text-muted/90 text-[10px]">
                          Orders: {dataPoint.orders}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="revenue"
                fill="#C05800"
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top-Selling Dishes Breakdown ──────────────────────────── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-orange" />
            <h2 className="font-heading font-extrabold text-sm text-espresso">
              Top Selling Dishes Today
            </h2>
          </div>
          <span className="text-[11px] text-muted">Ranked by volume</span>
        </div>

        {topDishes.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">
            No items sold yet today.
          </p>
        ) : (
          <div className="divide-y divide-chestnut/10">
            {topDishes.map((dish: { name: string; portions: number; revenue: number }, idx: number) => (
              <div
                key={dish.name}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange/10 text-orange font-bold flex items-center justify-center text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-heading font-bold text-espresso">
                      {dish.name}
                    </p>
                    <p className="text-[11px] text-muted">
                      {dish.portions} portion(s) ordered
                    </p>
                  </div>
                </div>

                <span className="font-heading font-extrabold text-espresso tabular-nums">
                  {currency}
                  {dish.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
