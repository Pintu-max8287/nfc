"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  Flame,
  Leaf,
  Drumstick,
  X,
  Loader2,
  CheckCircle2,
  UtensilsCrossed,
} from "lucide-react";

export interface MenuItemType {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  prepTime: string | null;
  spiceTag: string | null;
  dietaryTag: string | null;
  isAvailable: boolean;
  stockCount: number | null;
}

export interface CategoryType {
  id: string;
  name: string;
  sortOrder: number;
}

export interface CartItem {
  menuItem: MenuItemType;
  quantity: number;
  notes: string;
}

interface MenuViewProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    currencySymbol: string;
    taxRate: number;
  };
  tableNumber: string;
  categories: CategoryType[];
  menuItems: MenuItemType[];
}

export default function MenuView({
  restaurant,
  tableNumber,
  categories,
  menuItems,
}: MenuViewProps) {
  const router = useRouter();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Dish detail bottom sheet modal state
  const [selectedDish, setSelectedDish] = useState<MenuItemType | null>(null);
  const [dishNotes, setDishNotes] = useState("");
  const [dishModalQty, setDishModalQty] = useState(1);

  // Cart state
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "ALL" || item.categoryId === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart calculations
  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return Object.values(cart).reduce(
      (acc, curr) => acc + curr.menuItem.price * curr.quantity,
      0
    );
  }, [cart]);

  const taxAmount = Number(((subtotal * restaurant.taxRate) / 100).toFixed(2));
  const grandTotal = Number((subtotal + taxAmount).toFixed(2));

  // Cart operations
  const quickAddToCart = (item: MenuItemType, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!item.isAvailable || item.stockCount === 0) return;

    setCart((prev) => {
      const existing = prev[item.id];
      const newQty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [item.id]: {
          menuItem: item,
          quantity: newQty,
          notes: existing?.notes || "",
        },
      };
    });
  };

  const decrementCartItem = (itemId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  };

  const openDishModal = (item: MenuItemType) => {
    const existingInCart = cart[item.id];
    setSelectedDish(item);
    setDishNotes(existingInCart?.notes || "");
    setDishModalQty(existingInCart?.quantity || 1);
  };

  const confirmModalAddToCart = () => {
    if (!selectedDish) return;
    setCart((prev) => ({
      ...prev,
      [selectedDish.id]: {
        menuItem: selectedDish,
        quantity: dishModalQty,
        notes: dishNotes,
      },
    }));
    setSelectedDish(null);
  };

  // Place Order
  const handlePlaceOrder = async () => {
    if (totalCartCount === 0 || isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    setOrderError(null);

    try {
      const payload = {
        tableNumber,
        items: Object.values(cart).map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          notes: c.notes,
        })),
      };

      const res = await fetch(`/api/public/${restaurant.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setOrderError(data.error || "Failed to place order. Please try again.");
        setIsSubmittingOrder(false);
        return;
      }

      // Save to localStorage for active tracking banner
      try {
        localStorage.setItem(
          `dineflow_active_order_${restaurant.slug}_${tableNumber}`,
          JSON.stringify({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            placedAt: new Date().toISOString(),
          })
        );
      } catch {
        // Ignore
      }

      // Clear cart and redirect to tracker
      setCart({});
      setShowCartDrawer(false);
      router.push(
        `/${restaurant.slug}/table/${tableNumber}/track/${data.orderId}`
      );
    } catch {
      setOrderError("Network error. Please try placing your order again.");
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="mobile-shell pb-28 relative">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-chestnut/15 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href={`/${restaurant.slug}/table/${tableNumber}`}
            className="flex items-center gap-1.5 text-chestnut font-semibold text-xs p-1 rounded-xl hover:bg-chestnut/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Table {tableNumber}</span>
          </Link>

          <span className="font-heading font-extrabold text-sm text-espresso">
            {restaurant.name}
          </span>

          <button
            onClick={() => setShowCartDrawer(true)}
            className="relative p-2 rounded-xl text-chestnut hover:bg-chestnut/10 transition-colors"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5 text-orange" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-2 relative">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search appetizers, mains, drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-chestnut/20 rounded-2xl pl-9 pr-8 py-2 text-xs text-espresso placeholder:text-muted/70 focus:outline-none focus:border-orange transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-espresso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sticky Horizontal Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-3 pb-1 -mx-4 px-4 scroll-smooth">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`category-pill text-xs py-1.5 px-3.5 ${
              selectedCategory === "ALL" ? "active" : ""
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`category-pill text-xs py-1.5 px-3.5 ${
                selectedCategory === cat.id ? "active" : ""
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* ── Dish List ─────────────────────────────────────────────── */}
      <main className="p-4 space-y-3.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="w-10 h-10 text-muted/40 mx-auto mb-2" />
            <p className="text-sm font-heading font-bold text-espresso">
              No dishes found
            </p>
            <p className="text-xs text-muted mt-1">
              Try searching with another keyword or pick another category.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSoldOut = !item.isAvailable || item.stockCount === 0;
            const inCart = cart[item.id];

            return (
              <div
                key={item.id}
                onClick={() => !isSoldOut && openDishModal(item)}
                className={`card p-3 flex gap-3 cursor-pointer transition-all active:scale-[0.99] relative overflow-hidden ${
                  isSoldOut ? "opacity-60 grayscale cursor-not-allowed" : "hover:border-orange/30"
                }`}
              >
                {/* Dish Photo */}
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-chestnut/10 shrink-0">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted/50">
                      <UtensilsCrossed className="w-8 h-8" />
                    </div>
                  )}

                  {/* Dietary Tag Icon */}
                  {item.dietaryTag && (
                    <span
                      className={`absolute top-1.5 left-1.5 p-1 rounded-md text-[10px] font-bold ${
                        item.dietaryTag.toLowerCase().includes("veg") &&
                        !item.dietaryTag.toLowerCase().includes("non")
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.dietaryTag.toLowerCase().includes("veg") &&
                      !item.dietaryTag.toLowerCase().includes("non") ? (
                        <Leaf className="w-2.5 h-2.5" />
                      ) : (
                        <Drumstick className="w-2.5 h-2.5" />
                      )}
                    </span>
                  )}

                  {/* Sold Out Overlay */}
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-espresso/70 flex items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-status-alert px-1.5 py-0.5 rounded">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Dish Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading font-bold text-sm text-espresso leading-snug">
                        {item.name}
                      </h3>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-muted line-clamp-2 mt-1 leading-normal">
                        {item.description}
                      </p>
                    )}

                    {/* Meta Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {item.prepTime && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted bg-cream px-2 py-0.5 rounded-full border border-chestnut/10">
                          <Clock className="w-2.5 h-2.5" />
                          {item.prepTime}
                        </span>
                      )}
                      {item.spiceTag && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange bg-orange/10 px-2 py-0.5 rounded-full">
                          <Flame className="w-2.5 h-2.5" />
                          {item.spiceTag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div className="flex items-center justify-between mt-3 pt-1 border-t border-chestnut/10">
                    <span className="font-heading font-bold text-sm text-espresso tabular-nums">
                      {restaurant.currencySymbol}
                      {item.price.toFixed(2)}
                    </span>

                    {/* Add / Stepper Controls */}
                    {isSoldOut ? (
                      <span className="text-[11px] font-medium text-muted">
                        Unavailable
                      </span>
                    ) : inCart ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 bg-orange text-white rounded-xl px-2 py-1 shadow-sm"
                      >
                        <button
                          onClick={(e) => decrementCartItem(item.id, e)}
                          className="hover:scale-110 active:scale-95 transition-transform"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold tabular-nums">
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={(e) => quickAddToCart(item, e)}
                          className="hover:scale-110 active:scale-95 transition-transform"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => quickAddToCart(item, e)}
                        className="btn-primary text-xs py-1 px-3 rounded-xl flex items-center gap-1 shadow-sm"
                        aria-label={`Add ${item.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* ── Sticky Bottom Cart Summary Bar ────────────────────────── */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 max-w-[480px] mx-auto animate-in slide-in-from-bottom-4">
          <button
            onClick={() => setShowCartDrawer(true)}
            className="w-full bg-espresso text-cream p-4 rounded-2xl shadow-modal border border-orange/40 flex items-center justify-between hover:bg-espresso/95 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange flex items-center justify-center text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-cream">
                  {totalCartCount} {totalCartCount === 1 ? "Item" : "Items"} in
                  Cart
                </p>
                <p className="text-[11px] text-cream/70">
                  Subtotal: {restaurant.currencySymbol}
                  {subtotal.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange">View Cart &rarr;</span>
            </div>
          </button>
        </div>
      )}

      {/* ── Dish Detail Bottom Sheet Modal ────────────────────────── */}
      {selectedDish && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedDish(null)}
        >
          <div
            className="w-full max-w-[480px] bg-surface rounded-t-3xl p-6 shadow-modal border-t border-chestnut/20 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3">
              <div className="w-12 h-1 bg-chestnut/20 rounded-full mx-auto absolute top-3 left-1/2 -translate-x-1/2" />
              <button
                onClick={() => setSelectedDish(null)}
                className="ml-auto text-muted hover:text-espresso p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo */}
            {selectedDish.imageUrl && (
              <div className="w-full h-48 rounded-2xl overflow-hidden bg-chestnut/10 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedDish.imageUrl}
                  alt={selectedDish.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Name & Tags */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-heading font-extrabold text-espresso">
                  {selectedDish.name}
                </h2>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedDish.dietaryTag && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        selectedDish.dietaryTag.toLowerCase().includes("veg") &&
                        !selectedDish.dietaryTag.toLowerCase().includes("non")
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedDish.dietaryTag}
                    </span>
                  )}
                  {selectedDish.prepTime && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-cream text-muted border border-chestnut/15 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedDish.prepTime}
                    </span>
                  )}
                  {selectedDish.spiceTag && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-orange/10 text-orange flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {selectedDish.spiceTag}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xl font-heading font-extrabold text-orange tabular-nums">
                {restaurant.currencySymbol}
                {selectedDish.price.toFixed(2)}
              </span>
            </div>

            {/* Description */}
            {selectedDish.description && (
              <p className="text-xs text-muted leading-relaxed mt-3">
                {selectedDish.description}
              </p>
            )}

            {/* Cooking Notes */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-espresso mb-1">
                Special Instructions / Cooking Notes
              </label>
              <input
                type="text"
                placeholder="e.g., Less spicy, no onion, dressing on the side"
                value={dishNotes}
                onChange={(e) => setDishNotes(e.target.value)}
                className="w-full bg-cream border border-chestnut/20 rounded-xl px-3.5 py-2.5 text-xs text-espresso focus:outline-none focus:border-orange"
              />
            </div>

            {/* Quantity Stepper & Add Button */}
            <div className="flex items-center gap-3 mt-6 pt-3 border-t border-chestnut/15">
              <div className="flex items-center gap-3 bg-cream border border-chestnut/20 rounded-2xl px-3 py-2">
                <button
                  onClick={() => setDishModalQty((q) => Math.max(1, q - 1))}
                  disabled={dishModalQty <= 1}
                  className="text-chestnut disabled:opacity-30 p-1"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-espresso tabular-nums min-w-[20px] text-center">
                  {dishModalQty}
                </span>
                <button
                  onClick={() => setDishModalQty((q) => q + 1)}
                  className="text-chestnut p-1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={confirmModalAddToCart}
                className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  Add to Cart &bull; {restaurant.currencySymbol}
                  {(selectedDish.price * dishModalQty).toFixed(2)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cart Drawer / Place Order Modal ───────────────────────── */}
      {showCartDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowCartDrawer(false)}
        >
          <div
            className="w-full max-w-[480px] bg-surface rounded-t-3xl p-6 shadow-modal border-t border-chestnut/20 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange" />
                <h3 className="font-heading font-extrabold text-base text-espresso">
                  Your Table {tableNumber} Cart
                </h3>
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="text-muted hover:text-espresso p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {orderError && (
              <div className="bg-status-alert/10 text-status-alert text-xs p-3 rounded-xl my-2 border border-status-alert/20 font-medium">
                {orderError}
              </div>
            )}

            {/* Itemized Cart List */}
            <div className="flex-1 overflow-y-auto divide-y divide-chestnut/10 my-2">
              {Object.values(cart).length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm font-bold text-espresso">Cart is empty</p>
                  <p className="text-xs text-muted mt-1">
                    Add dishes from the menu to place an order.
                  </p>
                </div>
              ) : (
                Object.values(cart).map((item) => (
                  <div key={item.menuItem.id} className="py-3 flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-heading font-bold text-espresso">
                        {item.menuItem.name}
                      </p>
                      <p className="text-xs text-orange font-bold tabular-nums mt-0.5">
                        {restaurant.currencySymbol}
                        {item.menuItem.price.toFixed(2)}
                      </p>
                      {item.notes && (
                        <p className="text-[10px] text-muted italic mt-0.5">
                          &quot;{item.notes}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-cream border border-chestnut/20 rounded-xl px-2 py-1">
                      <button
                        onClick={() => decrementCartItem(item.menuItem.id)}
                        className="text-chestnut p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold tabular-nums min-w-[16px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => quickAddToCart(item.menuItem)}
                        className="text-chestnut p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bill Summary */}
            {totalCartCount > 0 && (
              <div className="bg-cream/70 p-4 rounded-2xl border border-chestnut/15 space-y-2 mt-2">
                <div className="flex justify-between text-xs text-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-espresso">
                    {restaurant.currencySymbol}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>Estimated Tax ({restaurant.taxRate}%)</span>
                  <span className="tabular-nums font-medium text-espresso">
                    {restaurant.currencySymbol}
                    {taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-heading font-extrabold text-espresso pt-2 border-t border-chestnut/15">
                  <span>Total Amount</span>
                  <span className="tabular-nums text-orange">
                    {restaurant.currencySymbol}
                    {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Place Order CTA */}
            {totalCartCount > 0 && (
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmittingOrder}
                className="w-full btn-primary py-3.5 mt-4 text-sm flex items-center justify-center gap-2 shadow-card"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Place Order &bull; Table {tableNumber}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
