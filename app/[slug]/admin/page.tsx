/**
 * app/[slug]/admin/page.tsx
 * Restaurant Owner Admin Overview Dashboard.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShoppingBag,
  Grid,
  UtensilsCrossed,
  ChefHat,
  BarChart3,
  Settings,
  BellRing,
  ArrowRight,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminOverviewPage({ params }: Props) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      currencySymbol: true,
      isActive: true,
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [activeOrders, totalTables, totalDishes, recentOrders, pendingRequests] =
    await Promise.all([
      prisma.order.count({
        where: {
          restaurantId: restaurant.id,
          createdAt: { gte: todayStart },
          status: { in: ["NEW", "PREPARING", "READY"] },
        },
      }),
      prisma.table.count({
        where: { restaurantId: restaurant.id, isActive: true },
      }),
      prisma.menuItem.count({
        where: { restaurantId: restaurant.id },
      }),
      prisma.order.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          table: { select: { tableNumber: true } },
          orderItems: { select: { nameSnapshot: true, quantity: true } },
        },
      }),
      prisma.serviceRequest.findMany({
        where: { restaurantId: restaurant.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: { table: { select: { tableNumber: true } } },
      }),
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-espresso">
            {restaurant.name} &bull; Dashboard
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Real-time dine-in floor control and daily operations
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/${slug}/kitchen`}
            className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <ChefHat className="w-4 h-4" />
            <span>Open Kitchen Display</span>
          </Link>
          <Link
            href={`/${slug}/admin/sales`}
            className="btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4 text-orange" />
            <span>Sales Analytics</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">
              Active Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange/15 text-orange flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-heading font-extrabold text-espresso tabular-nums">
            {activeOrders}
          </p>
          <p className="text-[11px] text-muted mt-1">Currently in kitchen</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">
              Floor Tables
            </span>
            <div className="w-8 h-8 rounded-xl bg-chestnut/15 text-chestnut flex items-center justify-center">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-heading font-extrabold text-espresso tabular-nums">
            {totalTables}
          </p>
          <p className="text-[11px] text-muted mt-1">Active QR dining tables</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">
              Menu Items
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange/15 text-orange flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-heading font-extrabold text-espresso tabular-nums">
            {totalDishes}
          </p>
          <p className="text-[11px] text-muted mt-1">Across all categories</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">
              Pending Alerts
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                pendingRequests.length > 0
                  ? "bg-status-alert/15 text-status-alert animate-pulse"
                  : "bg-green-100 text-status-ready"
              }`}
            >
              <BellRing className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-heading font-extrabold text-espresso tabular-nums">
            {pendingRequests.length}
          </p>
          <p className="text-[11px] text-muted mt-1">Waiter or bill calls</p>
        </div>
      </div>

      {/* Recent Orders Feed */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
          <h2 className="font-heading font-extrabold text-sm text-espresso">
            Recent Floor Activity
          </h2>
          <Link
            href={`/${slug}/admin/sales`}
            className="text-xs font-bold text-orange flex items-center gap-1 hover:underline"
          >
            <span>View Full Sales Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-muted text-center py-8">
            No orders placed yet today.
          </p>
        ) : (
          <div className="divide-y divide-chestnut/10">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-espresso">
                      Order #{order.orderNumber}
                    </span>
                    <span className="bg-chestnut/15 text-chestnut px-2 py-0.5 rounded text-[10px] font-bold">
                      Table {order.table.tableNumber}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        order.status === "READY"
                          ? "bg-green-100 text-status-ready"
                          : order.status === "PREPARING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-orange/15 text-orange"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">
                    {order.orderItems
                      .map((i) => `${i.quantity}x ${i.nameSnapshot}`)
                      .join(", ")}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-heading font-bold text-espresso tabular-nums">
                    {restaurant.currencySymbol}
                    {order.totalAmount.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-muted">
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
