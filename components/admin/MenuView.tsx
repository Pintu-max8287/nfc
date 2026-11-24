"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Clock,
  Flame,
  Leaf,
  Layers,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  _count?: { menuItems: number };
}

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  prepTime?: string | null;
  spiceTag?: string | null;
  dietaryTag?: string | null;
  isAvailable: boolean;
  stockCount: number | null;
  lowStockThreshold: number;
  categoryId: string;
  category: { name: string };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MenuView({
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
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<string>("");
  const [priceSaving, setPriceSaving] = useState(false);

  // Add Dish Modal State
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [dishForm, setDishForm] = useState({
    name: "",
    categoryId: "",
    price: "",
    description: "",
    imageUrl: "",
    prepTime: "15-20 min",
    spiceTag: "None",
    dietaryTag: "Veg",
    stockCount: "",
    lowStockThreshold: "5",
  });
  const [dishFormSubmitting, setDishFormSubmitting] = useState(false);
  const [dishFormError, setDishFormError] = useState<string | null>(null);

  // Add Category Modal State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const categories = data?.categories || [];
  const menuItems = data?.menuItems || [];

  // Filter menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "ALL" || item.categoryId === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Start editing price
  const startEditPrice = (item: MenuItem) => {
    setEditingPriceId(item.id);
    setNewPriceValue(item.price.toString());
  };

  // Save inline price
  const savePrice = async (itemId: string) => {
    const priceNum = parseFloat(newPriceValue);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid positive price.");
      return;
    }

    setPriceSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/menu/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: priceNum }),
      });

      if (!res.ok) {
        throw new Error("Failed to update price");
      }

      setEditingPriceId(null);
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving price";
      alert(message);
    } finally {
      setPriceSaving(false);
    }
  };

  // Quick toggle availability
  const toggleAvailability = async (item: MenuItem) => {
    try {
      await fetch(`/api/${slug}/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      mutate();
    } catch {
      alert("Failed to toggle availability.");
    }
  };

  // Delete dish
  const handleDeleteDish = async (itemId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/${slug}/admin/menu/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete dish");
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error deleting dish";
      alert(message);
    }
  };

  // Add Dish Submission
  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    setDishFormError(null);

    const priceNum = parseFloat(dishForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setDishFormError("Price must be a valid positive number.");
      return;
    }

    if (!dishForm.categoryId) {
      setDishFormError("Please select a category.");
      return;
    }

    setDishFormSubmitting(true);
    try {
      const res = await fetch(`/api/${slug}/admin/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dishForm.name,
          categoryId: dishForm.categoryId,
          price: priceNum,
          description: dishForm.description || undefined,
          imageUrl: dishForm.imageUrl || undefined,
          prepTime: dishForm.prepTime || undefined,
          spiceTag: dishForm.spiceTag !== "None" ? dishForm.spiceTag : undefined,
          dietaryTag: dishForm.dietaryTag,
          stockCount: dishForm.stockCount !== "" ? parseInt(dishForm.stockCount, 10) : null,
          lowStockThreshold: parseInt(dishForm.lowStockThreshold, 10) || 5,
          isAvailable: true,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to add dish");
      }

      setShowAddDishModal(false);
      setDishForm({
        name: "",
        categoryId: categories[0]?.id || "",
        price: "",
        description: "",
        imageUrl: "",
        prepTime: "15-20 min",
        spiceTag: "None",
        dietaryTag: "Veg",
        stockCount: "",
        lowStockThreshold: "5",
      });
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error creating dish";
      setDishFormError(message);
    } finally {
      setDishFormSubmitting(false);
    }
  };

  // Add Category Submission
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    if (!categoryName.trim()) return;

    setCategorySubmitting(true);
    try {
      const res = await fetch(`/api/${slug}/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim() }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create category");

      setShowAddCategoryModal(false);
      setCategoryName("");
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error creating category";
      setCategoryError(message);
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`Delete category "${catName}"? (Must have 0 menu items)`)) return;

    try {
      const res = await fetch(`/api/${slug}/admin/categories/${catId}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete category");

      if (activeCategory === catId) setActiveCategory("ALL");
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error deleting category";
      alert(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-espresso">
            Menu & Price Management
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure dishes, categories, and click any price to edit live
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="btn-secondary py-2 px-3.5 text-xs font-bold flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-orange" />
            <span>+ Category</span>
          </button>
          <button
            onClick={() => {
              if (categories.length > 0 && !dishForm.categoryId) {
                setDishForm((prev) => ({ ...prev, categoryId: categories[0].id }));
              }
              setShowAddDishModal(true);
            }}
            className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Dish</span>
          </button>
        </div>
      </div>

      {/* Categories Bar & Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeCategory === "ALL"
                ? "bg-orange text-white shadow-sm"
                : "bg-surface text-espresso/70 hover:bg-white hover:text-espresso border border-chestnut/15"
            }`}
          >
            All Items ({menuItems.length})
          </button>

          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.categoryId === cat.id).length;
            const isSelected = activeCategory === cat.id;
            return (
              <div key={cat.id} className="relative group shrink-0">
                <button
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-orange text-white shadow-sm"
                      : "bg-surface text-espresso/70 hover:bg-white hover:text-espresso border border-chestnut/15"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-chestnut/10 text-muted"
                    }`}
                  >
                    {count}
                  </span>
                </button>

                {count === 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat.id, cat.name);
                    }}
                    title="Delete empty category"
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-status-alert text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish or ingredient..."
            className="w-full bg-surface border border-chestnut/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
          />
        </div>
      </div>

      {/* Menu Items List / Grid */}
      {isLoading ? (
        <div className="card p-12 text-center text-xs text-muted">
          Loading menu items...
        </div>
      ) : error ? (
        <div className="card p-8 text-center text-xs text-status-alert font-bold">
          Failed to load menu data.
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <UtensilsCrossed className="w-8 h-8 text-muted/40 mx-auto" />
          <p className="text-xs text-muted">
            {searchQuery
              ? `No dishes found matching "${searchQuery}".`
              : "No dishes found in this category. Click '+ Add Dish' to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`card p-4 flex flex-col justify-between transition-all ${
                !item.isAvailable ? "opacity-70 bg-cream/30" : ""
              }`}
            >
              <div>
                {/* Image & Quick Status Bar */}
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-chestnut/10 mb-3">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted/40 gap-1">
                      <UtensilsCrossed className="w-6 h-6" />
                      <span className="text-[10px]">No image uploaded</span>
                    </div>
                  )}

                  {/* Category & Tag Badges */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <span className="bg-espresso/80 text-cream text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                      {item.category.name}
                    </span>
                    {item.dietaryTag && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm ${
                          item.dietaryTag === "Veg"
                            ? "bg-green-700/80 text-white"
                            : "bg-red-700/80 text-white"
                        }`}
                      >
                        {item.dietaryTag}
                      </span>
                    )}
                  </div>

                  {/* Availability Badge */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => toggleAvailability(item)}
                      title="Click to toggle availability"
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm transition-all ${
                        item.isAvailable
                          ? "bg-green-600 text-white"
                          : "bg-status-alert text-white"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Sold Out"}
                    </button>
                  </div>
                </div>

                {/* Dish Info */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-extrabold text-sm text-espresso line-clamp-1">
                      {item.name}
                    </h3>
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-muted line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-muted">
                    {item.prepTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange" />
                        {item.prepTime}
                      </span>
                    )}
                    {item.spiceTag && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange" />
                        {item.spiceTag}
                      </span>
                    )}
                    {item.stockCount !== null && (
                      <span
                        className={`font-bold ${
                          item.stockCount <= item.lowStockThreshold
                            ? "text-status-alert"
                            : "text-muted"
                        }`}
                      >
                        Stock: {item.stockCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Action Row (Inline Price Editor) */}
              <div className="mt-4 pt-3 border-t border-chestnut/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">
                    Price (Click to edit)
                  </span>
                  {editingPriceId === item.id ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs font-bold text-espresso">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        autoFocus
                        value={newPriceValue}
                        onChange={(e) => setNewPriceValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") savePrice(item.id);
                          if (e.key === "Escape") setEditingPriceId(null);
                        }}
                        className="w-20 bg-white border border-orange rounded px-1.5 py-0.5 text-xs font-bold text-espresso focus:outline-none focus:ring-1 focus:ring-orange"
                      />
                      <button
                        onClick={() => savePrice(item.id)}
                        disabled={priceSaving}
                        className="p-1 rounded bg-orange text-white hover:bg-orange/90"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingPriceId(null)}
                        className="p-1 rounded bg-chestnut/10 text-muted hover:text-espresso"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditPrice(item)}
                      className="group flex items-center gap-1.5 text-sm font-heading font-extrabold text-orange hover:text-orange/80 transition-colors"
                    >
                      <span>
                        {currencySymbol}
                        {item.price.toFixed(2)}
                      </span>
                      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted" />
                    </button>
                  )}
                </div>

                {/* Delete Dish Button */}
                <button
                  onClick={() => handleDeleteDish(item.id, item.name)}
                  className="p-1.5 rounded-lg text-muted/60 hover:text-status-alert hover:bg-status-alert/10 transition-colors"
                  title="Delete dish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Dish Modal ────────────────────────────────────────── */}
      {showAddDishModal && (
        <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-chestnut/20 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-orange" />
                <h3 className="font-heading font-extrabold text-base text-espresso">
                  Add New Dish
                </h3>
              </div>
              <button
                onClick={() => setShowAddDishModal(false)}
                className="text-muted hover:text-espresso p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {dishFormError && (
              <div className="p-3 rounded-xl bg-status-alert/10 border border-status-alert/30 text-status-alert text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{dishFormError}</span>
              </div>
            )}

            <form onSubmit={handleAddDish} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-espresso block mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Truffle Mushroom Risotto"
                    value={dishForm.name}
                    onChange={(e) =>
                      setDishForm({ ...dishForm, name: e.target.value })
                    }
                    className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
                  />
                </div>

                <div>
                  <label className="font-bold text-espresso block mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={dishForm.categoryId}
                    onChange={(e) =>
                      setDishForm({ ...dishForm, categoryId: e.target.value })
                    }
                    className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso focus:outline-none focus:ring-1 focus:ring-orange"
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-espresso block mb-1">
                    Price ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 299"
                    value={dishForm.price}
                    onChange={(e) =>
                      setDishForm({ ...dishForm, price: e.target.value })
                    }
                    className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
                  />
                </div>

                <div>
                  <label className="font-bold text-espresso block mb-1">
                    Prep Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15-20 min"
                    value={dishForm.prepTime}
                    onChange={(e) =>
                      setDishForm({ ...dishForm, prepTime: e.target.value })
                    }
                    className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-espresso block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, aromas, or serving suggestions..."
                  value={dishForm.description}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, description: e.target.value })
                  }
                  className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-espresso block mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={dishForm.imageUrl}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, imageUrl: e.target.value })
                  }
                  className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-espresso block mb-1">
                    Dietary Tag
                  </label>
                  <select
                    value={dishForm.dietaryTag}
                    onChange={(e) =>
                      setDishForm({ ...dishForm, dietaryTag: e.target.value })
                    }
                    className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso focus:outline-none focus:ring-1 focus:ring-orange"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Egg">Egg</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-espresso block mb-1">
                    Spice Tag
                  </label>
                  <select
                    value={dishForm.spiceTag}
                    onChange={(e) =>
                      setDishForm({ ...dishForm, spiceTag: e.target.value })
                    }
                    className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso focus:outline-none focus:ring-1 focus:ring-orange"
                  >
                    <option value="None">None</option>
                    <option value="Mild">Mild</option>
                    <option value="Medium spicy">Medium spicy</option>
                    <option value="Extra spicy">Extra spicy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-espresso block mb-1">
                    Initial Stock Count (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave empty for Unlimited"
                    value={dishForm.stockCount}
                    onChange={(e) =>
                      setDishForm({ ...dishForm, stockCount: e.target.value })
                    }
                    className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
                  />
                </div>

                <div>
                  <label className="font-bold text-espresso block mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dishForm.lowStockThreshold}
                    onChange={(e) =>
                      setDishForm({
                        ...dishForm,
                        lowStockThreshold: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso focus:outline-none focus:ring-1 focus:ring-orange"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-chestnut/15 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDishModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-espresso"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dishFormSubmitting}
                  className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
                >
                  {dishFormSubmitting ? "Creating..." : "Save Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Category Modal ───────────────────────────────────── */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-chestnut/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange" />
                <h3 className="font-heading font-extrabold text-base text-espresso">
                  Add Category
                </h3>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-muted hover:text-espresso p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryError && (
              <div className="p-3 rounded-xl bg-status-alert/10 border border-status-alert/30 text-status-alert text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{categoryError}</span>
              </div>
            )}

            <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-espresso block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starters, Beverages, Desserts"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-espresso"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="btn-primary py-2 px-5 text-xs font-bold"
                >
                  {categorySubmitting ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}