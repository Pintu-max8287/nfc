"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Infinity as InfinityIcon,
  UtensilsCrossed,
  Filter,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  stockCount: number | null;
  lowStockThreshold: number;
  categoryId: string;
  category: { name: string };
  imageUrl?: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AvailabilityView({
  slug,
  currencySymbol,
}: {
  slug: string;
  currencySymbol: string;
}) {
  const { data, error, mutate, isLoading } = useSWR<{
    categories: Category[];
    menuItems: MenuItem[];
  }>(`/api/${slug}/admin/menu`, fetcher);

  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "LOW_STOCK" | "SOLD_OUT">("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const categories = data?.categories || [];
  const menuItems = data?.menuItems || [];

  // Low stock / sold out counts
  const soldOutItems = menuItems.filter(
    (i) => !i.isAvailable || i.stockCount === 0
  );
  const lowStockItems = menuItems.filter(
    (i) =>
      i.isAvailable &&
      i.stockCount !== null &&
      i.stockCount > 0 &&
      i.stockCount <= i.lowStockThreshold
  );

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "ALL" || item.categoryId === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (filterMode === "SOLD_OUT") {
      matchesFilter = !item.isAvailable || item.stockCount === 0;
    } else if (filterMode === "LOW_STOCK") {
      matchesFilter =
        item.stockCount !== null &&
        item.stockCount > 0 &&
        item.stockCount <= item.lowStockThreshold;
    }

    return matchesCategory && matchesSearch && matchesFilter;
  });

  // Toggle availability
  const handleToggleAvailability = async (item: MenuItem) => {
    setUpdatingId(item.id);
    const newStatus = !item.isAvailable;

    try {
      await fetch(`/api/${slug}/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: newStatus }),
      });
      mutate();
    } catch {
      alert("Failed to update availability.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Adjust stock count (+1, -1, or set value)
  const handleAdjustStock = async (item: MenuItem, delta: number) => {
    const currentStock = item.stockCount ?? 0;
    const newStock = Math.max(0, currentStock + delta);

    setUpdatingId(item.id);
    try {
      await fetch(`/api/${slug}/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockCount: newStock,
          // Automatically mark unavailable if adjusted to 0, or available if > 0
          isAvailable: newStock === 0 ? false : item.isAvailable,
        }),
      });
      mutate();
    } catch {
      alert("Failed to update stock portion.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Set unlimited stock
  const handleSetUnlimited = async (item: MenuItem) => {
    setUpdatingId(item.id);
    try {
      await fetch(`/api/${slug}/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockCount: null, isAvailable: true }),
      });
      mutate();
    } catch {
      alert("Failed to set unlimited stock.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Set specific stock number
  const handleSetExactStock = async (item: MenuItem) => {
    const input = prompt(
      `Enter portion count for "${item.name}":`,
      item.stockCount !== null ? item.stockCount.toString() : "10"
    );
    if (input === null) return;

    const parsed = parseInt(input.trim(), 10);
    if (isNaN(parsed) || parsed < 0) {
      alert("Please enter a valid non-negative number.");
      return;
    }

    setUpdatingId(item.id);
    try {
      await fetch(`/api/${slug}/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockCount: parsed,
          isAvailable: parsed > 0,
        }),
      });
      mutate();
    } catch {
      alert("Failed to update stock portion.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-espresso">
          Live Stock & Availability
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Instantly toggle 86&apos;d dishes and adjust remaining portion counts
        </p>
      </div>

      {/* KPI Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setFilterMode("ALL")}
          className={`card p-4 text-left transition-all ${
            filterMode === "ALL"
              ? "ring-2 ring-orange shadow-md"
              : "hover:bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Total Dishes
            </span>
            <CheckCircle2 className="w-4 h-4 text-status-ready" />
          </div>
          <p className="text-2xl font-heading font-extrabold text-espresso mt-1 tabular-nums">
            {menuItems.length}
          </p>
          <span className="text-[11px] text-muted">All active menu offerings</span>
        </button>

        <button
          onClick={() => setFilterMode("LOW_STOCK")}
          className={`card p-4 text-left transition-all ${
            filterMode === "LOW_STOCK"
              ? "ring-2 ring-orange shadow-md"
              : "hover:bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-heading font-extrabold text-espresso mt-1 tabular-nums">
            {lowStockItems.length}
          </p>
          <span className="text-[11px] text-muted">
            Portions &le; configured threshold
          </span>
        </button>

        <button
          onClick={() => setFilterMode("SOLD_OUT")}
          className={`card p-4 text-left transition-all ${
            filterMode === "SOLD_OUT"
              ? "ring-2 ring-orange shadow-md"
              : "hover:bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Currently 86&apos;d (Sold Out)
            </span>
            <XCircle className="w-4 h-4 text-status-alert" />
          </div>
          <p className="text-2xl font-heading font-extrabold text-espresso mt-1 tabular-nums">
            {soldOutItems.length}
          </p>
          <span className="text-[11px] text-muted">Hidden from customer orders</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeCategory === "ALL"
                ? "bg-orange text-white shadow-sm"
                : "bg-surface text-espresso/70 hover:bg-white hover:text-espresso border border-chestnut/15"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeCategory === cat.id
                  ? "bg-orange text-white shadow-sm"
                  : "bg-surface text-espresso/70 hover:bg-white hover:text-espresso border border-chestnut/15"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish..."
            className="w-full bg-surface border border-chestnut/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
          />
        </div>
      </div>

      {/* Dishes Table / Cards */}
      {isLoading ? (
        <div className="card p-12 text-center text-xs text-muted">
          Loading stock items...
        </div>
      ) : error ? (
        <div className="card p-8 text-center text-xs text-status-alert font-bold">
          Failed to load stock data.
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-12 text-center space-y-2">
          <UtensilsCrossed className="w-8 h-8 text-muted/40 mx-auto" />
          <p className="text-xs text-muted">No dishes match your filter.</p>
        </div>
      ) : (
        <div className="card divide-y divide-chestnut/10 overflow-hidden">
          {filteredItems.map((item) => {
            const isSoldOut = !item.isAvailable || item.stockCount === 0;
            const isLowStock =
              item.isAvailable &&
              item.stockCount !== null &&
              item.stockCount > 0 &&
              item.stockCount <= item.lowStockThreshold;

            return (
              <div
                key={item.id}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isSoldOut
                    ? "bg-status-alert/5"
                    : isLowStock
                    ? "bg-amber-500/5"
                    : "hover:bg-white/50"
                }`}
              >
                {/* Dish Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-chestnut/10 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed className="w-5 h-5 text-muted/40" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-extrabold text-sm text-espresso">
                        {item.name}
                      </h3>
                      <span className="text-[10px] bg-chestnut/10 text-chestnut px-2 py-0.5 rounded font-bold">
                        {item.category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-orange tabular-nums">
                        {currencySymbol}
                        {item.price.toFixed(2)}
                      </span>
                      {isLowStock && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-800 font-bold px-2 py-0.2 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Low Stock ({item.stockCount} left)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Controls & Availability Toggle */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Stock Portion Counter */}
                  <div className="flex items-center gap-1.5 bg-surface border border-chestnut/20 rounded-2xl p-1">
                    {item.stockCount === null ? (
                      <div className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-muted">
                        <InfinityIcon className="w-4 h-4 text-orange" />
                        <span>Unlimited</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAdjustStock(item, -1)}
                          disabled={updatingId === item.id || item.stockCount <= 0}
                          title="Decrease 1 portion"
                          className="w-7 h-7 rounded-xl bg-white text-espresso hover:bg-orange hover:text-white flex items-center justify-center font-bold text-xs shadow-sm transition-colors disabled:opacity-40"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSetExactStock(item)}
                          title="Click to edit stock count directly"
                          className="px-2.5 py-1 text-xs font-heading font-extrabold text-espresso hover:text-orange tabular-nums"
                        >
                          {item.stockCount} portions
                        </button>

                        <button
                          onClick={() => handleAdjustStock(item, 1)}
                          disabled={updatingId === item.id}
                          title="Increase 1 portion"
                          className="w-7 h-7 rounded-xl bg-white text-espresso hover:bg-orange hover:text-white flex items-center justify-center font-bold text-xs shadow-sm transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Switch between unlimited and portions */}
                    {item.stockCount === null ? (
                      <button
                        onClick={() => handleSetExactStock(item)}
                        className="text-[10px] font-bold text-orange hover:underline px-2"
                      >
                        Set Portions
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSetUnlimited(item)}
                        className="text-[10px] font-bold text-muted hover:text-espresso px-2"
                        title="Set to unlimited stock"
                      >
                        &infin; Unlimited
                      </button>
                    )}
                  </div>

                  {/* Instant Toggle Switch */}
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    disabled={updatingId === item.id}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                      item.isAvailable
                        ? "bg-green-600 text-white shadow-sm hover:bg-green-700"
                        : "bg-status-alert text-white shadow-sm hover:bg-status-alert/90"
                    }`}
                  >
                    {item.isAvailable ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Available</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Sold Out</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}