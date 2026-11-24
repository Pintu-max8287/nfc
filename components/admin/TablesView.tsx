"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Plus,
  Trash2,
  Printer,
  ExternalLink,
  Users,
  UtensilsCrossed,
  Wifi,
  X,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  isActive: boolean;
  _count?: { orders: number };
}

interface RestaurantInfo {
  name: string;
  wifiName?: string | null;
  wifiPassword?: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TablesView({
  slug,
  restaurant,
}: {
  slug: string;
  restaurant: RestaurantInfo;
}) {
  const { data, error, mutate, isLoading } = useSWR<{ tables: Table[] }>(
    `/api/${slug}/admin/tables`,
    fetcher
  );

  const [origin, setOrigin] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Tent card print modal state
  const [printingTable, setPrintingTable] = useState<Table | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const tables = data?.tables || [];

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const capNum = parseInt(capacity, 10);
    if (!tableNumber.trim()) {
      setFormError("Table number is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/${slug}/admin/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: tableNumber.trim(),
          capacity: isNaN(capNum) ? 4 : capNum,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to add table");
      }

      setShowAddModal(false);
      setTableNumber("");
      setCapacity("4");
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error adding table";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = async (tableId: string, num: string) => {
    if (!confirm(`Are you sure you want to remove Table ${num}?`)) return;

    try {
      const res = await fetch(`/api/${slug}/admin/tables/${tableId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete table");
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error deleting table";
      alert(message);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-espresso">
            Tables & Dynamic QR Studio
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage floor tables and generate printable branded QR tent cards
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Table</span>
        </button>
      </div>

      {/* Tables Grid */}
      {isLoading ? (
        <div className="card p-12 text-center text-xs text-muted">
          Loading tables...
        </div>
      ) : error ? (
        <div className="card p-8 text-center text-xs text-status-alert font-bold">
          Failed to load tables.
        </div>
      ) : tables.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <QrCode className="w-10 h-10 text-muted/40 mx-auto" />
          <p className="text-xs text-muted">
            No tables added yet. Click &quot;+ Add Table&quot; to create your first QR code.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => {
            const tableUrl = `${origin || ""}/${slug}/table/${table.tableNumber}`;

            return (
              <div
                key={table.id}
                className="card p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow border border-chestnut/15"
              >
                {/* Top Table Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-orange text-white flex items-center justify-center font-heading font-extrabold text-sm shadow-sm">
                      {table.tableNumber}
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-sm text-espresso">
                        Table {table.tableNumber}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted">
                        <Users className="w-3 h-3 text-chestnut" />
                        <span>Seats {table.capacity}</span>
                        {table._count && (
                          <span className="text-[10px] text-muted">
                            &bull; {table._count.orders} orders placed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                    className="p-1.5 rounded-lg text-muted/60 hover:text-status-alert hover:bg-status-alert/10 transition-colors"
                    title="Remove table"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Scannable QR Code Canvas */}
                <div className="bg-cream rounded-2xl p-4 flex flex-col items-center justify-center border border-chestnut/15 space-y-2">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-chestnut/10">
                    <QRCodeSVG
                      value={tableUrl}
                      size={130}
                      level="H"
                      includeMargin={false}
                      fgColor="#38240D"
                      bgColor="#FFFFFF"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyUrl(tableUrl)}
                      className="text-[11px] font-bold text-muted hover:text-orange flex items-center gap-1 transition-colors"
                      title="Copy table link"
                    >
                      {copiedUrl === tableUrl ? (
                        <>
                          <Check className="w-3 h-3 text-status-ready" />
                          <span className="text-status-ready">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <span className="text-muted/40">&bull;</span>

                    <Link
                      href={`/${slug}/table/${table.tableNumber}`}
                      target="_blank"
                      className="text-[11px] font-bold text-orange hover:underline flex items-center gap-1"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Action Button: Print Tent Card */}
                <button
                  onClick={() => setPrintingTable(table)}
                  className="w-full btn-secondary py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4 text-orange" />
                  <span>View &amp; Print Tent Card</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Table Modal ────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-chestnut/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-orange" />
                <h3 className="font-heading font-extrabold text-base text-espresso">
                  Add Dining Table
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

            <form onSubmit={handleAddTable} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-espresso block mb-1">
                  Table Number or Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01, 07, Bar-1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>

              <div>
                <label className="font-bold text-espresso block mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full bg-white border border-chestnut/20 rounded-xl px-3 py-2 text-espresso focus:outline-none focus:ring-1 focus:ring-orange"
                />
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
                  {submitting ? "Adding..." : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Printable Tent Card Modal ──────────────────────────────── */}
      {printingTable && (
        <div className="fixed inset-0 z-50 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-chestnut/20 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            {/* Modal Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-chestnut/15 print:hidden">
              <h3 className="font-heading font-extrabold text-sm text-espresso flex items-center gap-2">
                <Printer className="w-4 h-4 text-orange" />
                <span>Table Tent Card Preview</span>
              </h3>
              <button
                onClick={() => setPrintingTable(null)}
                className="text-muted hover:text-espresso p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* The Actual Tent Card (Printable) */}
            <div
              id="printable-tent-card"
              className="bg-[#FDFBD4] border-4 border-[#38240D] rounded-3xl p-6 text-center space-y-4 shadow-lg text-espresso"
            >
              {/* Restaurant Brand Header */}
              <div className="space-y-1 border-b-2 border-dashed border-[#713600]/30 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange text-white flex items-center justify-center mx-auto mb-1">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <h2 className="font-heading font-extrabold text-xl text-espresso tracking-tight">
                  {restaurant.name}
                </h2>
                <p className="text-[11px] font-bold text-chestnut uppercase tracking-widest">
                  Scan &bull; Order &bull; Dine
                </p>
              </div>

              {/* Table Number Badge */}
              <div className="inline-block bg-[#38240D] text-[#FDFBD4] px-5 py-1.5 rounded-full font-heading font-extrabold text-sm tracking-wide shadow-sm">
                TABLE {printingTable.tableNumber}
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-md border-2 border-[#38240D]/20">
                <QRCodeSVG
                  value={`${origin}/${slug}/table/${printingTable.tableNumber}`}
                  size={180}
                  level="H"
                  includeMargin={false}
                  fgColor="#38240D"
                  bgColor="#FFFFFF"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-espresso">
                  Point phone camera at QR to view full digital menu
                </p>
                <p className="text-[10px] text-muted">
                  No app download required &bull; Instant order to kitchen
                </p>
              </div>

              {/* Wi-Fi Details if configured */}
              {restaurant.wifiName && (
                <div className="pt-2 border-t border-[#713600]/20 flex items-center justify-center gap-2 text-[11px] text-chestnut font-semibold">
                  <Wifi className="w-3.5 h-3.5 text-orange" />
                  <span>
                    Wi-Fi: <strong className="text-espresso">{restaurant.wifiName}</strong>
                    {restaurant.wifiPassword && (
                      <>
                        {" "}
                        &bull; Pass:{" "}
                        <strong className="text-espresso">{restaurant.wifiPassword}</strong>
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Print Trigger Button */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-chestnut/15 print:hidden">
              <button
                type="button"
                onClick={() => setPrintingTable(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-espresso"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print This Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}