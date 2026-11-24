"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ChefHat,
  Volume2,
  VolumeX,
  BellRing,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowRight,
  LogOut,
  LayoutDashboard,
  UtensilsCrossed,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface OrderItem {
  id: string;
  nameSnapshot: string;
  quantity: number;
  notes?: string | null;
}

interface KDSOrder {
  id: string;
  orderNumber: number;
  status: "NEW" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
  createdAt: string;
  table: {
    tableNumber: string;
  };
  orderItems: OrderItem[];
}

interface ServiceRequest {
  id: string;
  type: "WAITER_CALL" | "BILL_REQUEST";
  status: "PENDING" | "RESOLVED";
  createdAt: string;
  table: {
    tableNumber: string;
  };
}

interface KDSViewProps {
  slug: string;
  initialRestaurantName: string;
}

// Web Audio API chime generator (no external files required)
function playChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    const now = ctx.currentTime;

    // 2-tone melodic alert: D5 -> A5
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // Audio autoplay restrictions or unsupported
  }
}

// Elapsed timer component for each ticket
function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(
        Math.max(
          0,
          Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const isUrgent = minutes >= 15;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-mono font-bold tabular-nums transition-colors ${
        isUrgent
          ? "bg-status-alert text-white animate-pulse"
          : "bg-espresso/10 text-espresso"
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      {isUrgent && <AlertTriangle className="w-3 h-3 text-white" />}
    </div>
  );
}

// Relative time formatting for service alert banner
function relativeTime(isoString: string): string {
  const diffSec = Math.max(
    0,
    Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  );
  if (diffSec < 60) return "just now";
  const mins = Math.floor(diffSec / 60);
  return `${mins}m ago`;
}

export default function KDSView({ slug, initialRestaurantName }: KDSViewProps) {
  // SWR auto-polling every 3 seconds for real-time kitchen sync
  const { data, mutate } = useSWR(
    `/api/restaurant/${slug}/kitchen`,
    fetcher,
    {
      refreshInterval: 3000,
      revalidateOnFocus: true,
    }
  );

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(
    null
  );

  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  const orders: KDSOrder[] = data?.orders || [];
  const serviceRequests: ServiceRequest[] = data?.serviceRequests || [];
  const restaurantName = data?.restaurant?.name || initialRestaurantName;

  // Sound alert when new order arrives
  useEffect(() => {
    if (!data?.orders) return;

    const currentOrderIds = new Set<string>(orders.map((o) => o.id));
    // Find any new order IDs not seen in previous tick
    const hasNewOrder = orders.some(
      (o) => o.status === "NEW" && !prevOrderIdsRef.current.has(o.id)
    );

    if (hasNewOrder && prevOrderIdsRef.current.size > 0 && soundEnabled) {
      playChime();
    }

    prevOrderIdsRef.current = currentOrderIds;
  }, [data?.orders, orders, soundEnabled]);

  // Group orders by Kanban column
  const newOrders = useMemo(
    () => orders.filter((o) => o.status === "NEW"),
    [orders]
  );
  const preparingOrders = useMemo(
    () => orders.filter((o) => o.status === "PREPARING"),
    [orders]
  );
  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === "READY"),
    [orders]
  );

  // Status transition handler
  const handleUpdateStatus = async (
    orderId: string,
    nextStatus: "PREPARING" | "READY" | "SERVED"
  ) => {
    if (updatingOrderId) return;
    setUpdatingOrderId(orderId);

    // Optimistic SWR cache update
    const previousOrders = data?.orders || [];
    mutate(
      {
        ...data,
        orders: previousOrders
          .map((o: KDSOrder) =>
            o.id === orderId ? { ...o, status: nextStatus } : o
          )
          .filter((o: KDSOrder) => o.status !== "SERVED"),
      },
      false
    );

    try {
      const res = await fetch(`/api/restaurant/${slug}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      mutate();
    } catch (err) {
      console.error(err);
      mutate(); // rollback
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Service request resolution
  const handleResolveRequest = async (requestId: string) => {
    if (resolvingRequestId) return;
    setResolvingRequestId(requestId);

    // Optimistic update
    mutate(
      {
        ...data,
        serviceRequests: serviceRequests.filter((r) => r.id !== requestId),
      },
      false
    );

    try {
      await fetch(
        `/api/restaurant/${slug}/service-requests/${requestId}`,
        { method: "PATCH" }
      );
      mutate();
    } catch {
      mutate();
    } finally {
      setResolvingRequestId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-espresso text-cream flex flex-col font-sans select-none">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <header className="bg-espresso border-b border-chestnut/40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-card">
        {/* Left: Branding & Live Sync */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange flex items-center justify-center text-white shadow-sm">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-heading font-extrabold text-cream leading-tight tracking-wide">
                {restaurantName}
              </h1>
              <span className="text-[10px] font-bold bg-cream/15 text-cream px-2 py-0.5 rounded-full uppercase tracking-wider">
                Kitchen Display
              </span>
            </div>
            {/* Live Sync Indicator */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-ready opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-ready" />
              </span>
              <span className="text-[11px] text-cream/70 font-mono">
                Live Sync (3s polling) &bull; {orders.length} Active Tickets
              </span>
            </div>
          </div>
        </div>

        {/* Right: Audio Toggle, Navigation & Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              soundEnabled
                ? "bg-orange/20 text-orange border-orange/40 hover:bg-orange/30"
                : "bg-white/5 text-muted border-white/10 hover:bg-white/10"
            }`}
            title="Toggle audio alert for incoming orders"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Audio Alert: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Audio Alert: OFF</span>
              </>
            )}
          </button>

          <Link
            href={`/${slug}/admin`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-cream border border-white/10 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Admin Hub</span>
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-cream/70 hover:text-status-alert hover:bg-status-alert/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Live Table Alerts Bar (Waiter Call & Bill Request) ────── */}
      {serviceRequests.length > 0 && (
        <aside className="bg-status-alert text-white px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span className="text-xs font-heading font-extrabold tracking-wide uppercase">
              Table Assistance Required ({serviceRequests.length}):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {serviceRequests.map((req) => (
              <div
                key={req.id}
                className="bg-black/25 px-3 py-1 rounded-xl flex items-center gap-2 text-xs border border-white/20"
              >
                {req.type === "WAITER_CALL" ? (
                  <BellRing className="w-3.5 h-3.5 text-yellow-300" />
                ) : (
                  <Receipt className="w-3.5 h-3.5 text-emerald-300" />
                )}
                <span className="font-bold">Table {req.table.tableNumber}</span>
                <span className="text-white/80">
                  {req.type === "WAITER_CALL"
                    ? "requested waiter"
                    : "requested bill"}
                </span>
                <span className="text-white/60 text-[10px]">
                  ({relativeTime(req.createdAt)})
                </span>
                <button
                  onClick={() => handleResolveRequest(req.id)}
                  disabled={resolvingRequestId === req.id}
                  className="ml-1 bg-white text-espresso px-2 py-0.5 rounded-md text-[10px] font-bold hover:bg-cream active:scale-95 transition-transform"
                >
                  {resolvingRequestId === req.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Mark Resolved &check;"
                  )}
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* ── 3-Column Kanban Board ─────────────────────────────────── */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto">
        {/* ── Column 1: NEW ────────────────────────────────────────── */}
        <div className="flex flex-col rounded-3xl bg-black/25 border border-chestnut/30 p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-chestnut/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange animate-pulse" />
              <h2 className="font-heading font-extrabold text-sm text-cream tracking-wide">
                NEW ORDERS
              </h2>
            </div>
            <span className="bg-orange text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {newOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            {newOrders.length === 0 ? (
              <div className="text-center py-16 text-cream/30">
                <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No new orders waiting</p>
              </div>
            ) : (
              newOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl p-4 bg-surface text-espresso shadow-card border-2 border-orange/40 flex flex-col justify-between animate-in zoom-in-95 duration-200"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-chestnut/15">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-heading font-extrabold text-espresso">
                          #{order.orderNumber}
                        </span>
                        <span className="bg-chestnut text-cream text-xs font-heading font-extrabold px-2 py-0.5 rounded-md">
                          T{order.table.tableNumber}
                        </span>
                      </div>
                      <ElapsedTimer createdAt={order.createdAt} />
                    </div>

                    {/* Itemized Dish List */}
                    <div className="my-3 space-y-2">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="text-xs">
                          <div className="flex items-start justify-between font-bold text-espresso text-sm leading-snug">
                            <span>{item.nameSnapshot}</span>
                            <span className="bg-orange/15 text-orange px-2 py-0.5 rounded font-mono">
                              &times;{item.quantity}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-muted italic bg-cream/70 px-2 py-1 rounded-md mt-1 border border-chestnut/10">
                              Note: &quot;{item.notes}&quot;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                    disabled={updatingOrderId === order.id}
                    className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2 mt-2 shadow-sm"
                  >
                    {updatingOrderId === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Start Preparing</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Column 2: PREPARING ──────────────────────────────────── */}
        <div className="flex flex-col rounded-3xl bg-black/25 border border-chestnut/30 p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-chestnut/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-chestnut" />
              <h2 className="font-heading font-extrabold text-sm text-cream tracking-wide">
                PREPARING
              </h2>
            </div>
            <span className="bg-chestnut text-cream text-xs font-bold px-2.5 py-0.5 rounded-full">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-16 text-cream/30">
                <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No orders cooking</p>
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl p-4 bg-surface text-espresso shadow-card border border-chestnut/20 flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-chestnut/15">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-heading font-extrabold text-espresso">
                          #{order.orderNumber}
                        </span>
                        <span className="bg-chestnut text-cream text-xs font-heading font-extrabold px-2 py-0.5 rounded-md">
                          T{order.table.tableNumber}
                        </span>
                      </div>
                      <ElapsedTimer createdAt={order.createdAt} />
                    </div>

                    {/* Itemized Dish List */}
                    <div className="my-3 space-y-2">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="text-xs">
                          <div className="flex items-start justify-between font-bold text-espresso text-sm leading-snug">
                            <span>{item.nameSnapshot}</span>
                            <span className="bg-chestnut/15 text-chestnut px-2 py-0.5 rounded font-mono">
                              &times;{item.quantity}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-muted italic bg-cream/70 px-2 py-1 rounded-md mt-1 border border-chestnut/10">
                              Note: &quot;{item.notes}&quot;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleUpdateStatus(order.id, "READY")}
                    disabled={updatingOrderId === order.id}
                    className="w-full bg-chestnut hover:bg-chestnut/90 active:scale-[0.99] text-cream rounded-2xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 mt-2 shadow-sm transition-all"
                  >
                    {updatingOrderId === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Ready</span>
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Column 3: READY ──────────────────────────────────────── */}
        <div className="flex flex-col rounded-3xl bg-black/25 border border-chestnut/30 p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-chestnut/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-ready" />
              <h2 className="font-heading font-extrabold text-sm text-cream tracking-wide">
                READY TO SERVE
              </h2>
            </div>
            <span className="bg-status-ready text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            {readyOrders.length === 0 ? (
              <div className="text-center py-16 text-cream/30">
                <BellRing className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No orders awaiting pickup</p>
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl p-4 bg-surface text-espresso shadow-card border-2 border-status-ready/60 flex flex-col justify-between animate-in zoom-in-95"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-chestnut/15">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-heading font-extrabold text-espresso">
                          #{order.orderNumber}
                        </span>
                        <span className="bg-status-ready text-white text-xs font-heading font-extrabold px-2 py-0.5 rounded-md">
                          T{order.table.tableNumber}
                        </span>
                      </div>
                      <ElapsedTimer createdAt={order.createdAt} />
                    </div>

                    {/* Itemized Dish List */}
                    <div className="my-3 space-y-2">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="text-xs">
                          <div className="flex items-start justify-between font-bold text-espresso text-sm leading-snug">
                            <span>{item.nameSnapshot}</span>
                            <span className="bg-status-ready/15 text-status-ready px-2 py-0.5 rounded font-mono">
                              &times;{item.quantity}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-muted italic bg-cream/70 px-2 py-1 rounded-md mt-1 border border-chestnut/10">
                              Note: &quot;{item.notes}&quot;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleUpdateStatus(order.id, "SERVED")}
                    disabled={updatingOrderId === order.id}
                    className="w-full bg-status-ready hover:bg-status-ready/90 active:scale-[0.99] text-white rounded-2xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 mt-2 shadow-sm transition-all"
                  >
                    {updatingOrderId === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Served &bull; Archive</span>
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
