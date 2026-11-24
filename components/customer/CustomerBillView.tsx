"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  Banknote,
  Store,
  CheckCircle2,
  Sparkles,
  Loader2,
  BellRing,
  Star,
  Copy,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

interface BillItem {
  id: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  notes?: string | null;
}

interface BillOrder {
  id: string;
  orderNumber: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  orderItems: BillItem[];
}

interface CustomerBillViewProps {
  slug: string;
  tableNumber: string;
  restaurant: {
    name: string;
    currencySymbol: string;
    taxRate: number;
  };
  initialOrders: BillOrder[];
  initialSubtotal: number;
  initialTaxAmount: number;
  initialTotalAmount: number;
}

export default function CustomerBillView({
  slug,
  tableNumber,
  restaurant,
  initialOrders,
  initialSubtotal,
  initialTaxAmount,
  initialTotalAmount,
}: CustomerBillViewProps) {
  const [orders, setOrders] = useState<BillOrder[]>(initialOrders);
  const [subtotal, setSubtotal] = useState(initialSubtotal);
  const [taxAmount, setTaxAmount] = useState(initialTaxAmount);
  const [totalAmount, setTotalAmount] = useState(initialTotalAmount);

  // Payment states
  const [selectedMethod, setSelectedMethod] = useState<
    "ONLINE" | "CASH_AT_TABLE" | "PAY_AT_COUNTER"
  >("ONLINE");
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<null | {
    method: "ONLINE" | "CASH_AT_TABLE" | "PAY_AT_COUNTER";
    totalPaid: number;
  }>(null);

  // Service alert states
  const [isAlertingStaff, setIsAlertingStaff] = useState(false);
  const [staffAlertToast, setStaffAlertToast] = useState<string | null>(null);

  // Online checkout card form simulation
  const [upiId, setUpiId] = useState("guest@okaxis");
  const [copiedPass, setCopiedPass] = useState(false);

  const showToast = (msg: string) => {
    setStaffAlertToast(msg);
    setTimeout(() => setStaffAlertToast(null), 4000);
  };

  const handleRequestBillStaff = async () => {
    if (isAlertingStaff) return;
    setIsAlertingStaff(true);
    try {
      const res = await fetch(`/api/public/${slug}/service-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber, type: "BILL_REQUEST" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Bill requested! Waiter has been alerted.");
      } else {
        showToast(data.error || "Failed to notify staff.");
      }
    } catch {
      showToast("Network error. Please ask your server.");
    } finally {
      setIsAlertingStaff(false);
    }
  };

  const handleConfirmPayment = async (
    method: "ONLINE" | "CASH_AT_TABLE" | "PAY_AT_COUNTER"
  ) => {
    setIsProcessingPayment(true);
    try {
      const res = await fetch(
        `/api/public/${slug}/table/${tableNumber}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod: method }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setShowOnlineModal(false);
        setPaymentSuccess({
          method,
          totalPaid: totalAmount,
        });
        // Clear active order local storage on full payment
        if (method === "ONLINE") {
          try {
            localStorage.removeItem(`dineflow_active_order_${slug}_${tableNumber}`);
          } catch {
            // Ignore
          }
        }
      } else {
        showToast(data.error || "Payment submission failed");
      }
    } catch {
      showToast("Network issue during payment processing.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="mobile-shell pb-24">
      {/* Toast Alert */}
      {staffAlertToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-espresso text-cream px-4 py-3 rounded-2xl shadow-modal flex items-center gap-3 border border-chestnut/30 animate-in fade-in slide-in-from-top-4">
          <BellRing className="w-5 h-5 text-orange shrink-0 animate-bounce" />
          <p className="text-xs font-medium leading-tight flex-1">
            {staffAlertToast}
          </p>
          <button
            onClick={() => setStaffAlertToast(null)}
            className="text-muted hover:text-cream text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
          Digital Billing
        </span>
        <button
          onClick={handleRequestBillStaff}
          disabled={isAlertingStaff}
          className="text-xs font-bold text-orange flex items-center gap-1 hover:underline disabled:opacity-50"
        >
          {isAlertingStaff ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <BellRing className="w-3.5 h-3.5" />
          )}
          <span>Ping Staff</span>
        </button>
      </header>

      <main className="p-4 space-y-4">
        {/* ── Payment Successful Screen ──────────────────────────── */}
        {paymentSuccess ? (
          <div className="card p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-status-ready/15 text-status-ready flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-status-ready uppercase tracking-wider bg-status-ready/10 px-2.5 py-0.5 rounded-full">
                {paymentSuccess.method === "ONLINE"
                  ? "Paid in Full"
                  : paymentSuccess.method === "CASH_AT_TABLE"
                  ? "Staff Notified for Cash"
                  : "Counter Pass Generated"}
              </span>
              <h1 className="text-2xl font-heading font-extrabold text-espresso mt-2">
                {restaurant.currencySymbol}
                {paymentSuccess.totalPaid.toFixed(2)}
              </h1>
              <p className="text-xs text-muted mt-1">
                Table {tableNumber} &bull; {restaurant.name}
              </p>
            </div>

            {paymentSuccess.method === "ONLINE" && (
              <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
                Thank you! Your payment has been received and confirmed by the
                system.
              </p>
            )}

            {paymentSuccess.method === "CASH_AT_TABLE" && (
              <div className="bg-cream/80 border border-chestnut/20 rounded-2xl p-4 text-xs text-muted text-left">
                <p className="font-bold text-espresso mb-1">
                  💵 Paying with Cash:
                </p>
                <p>
                  A waiter will bring the change folder and physical receipt to
                  Table {tableNumber} shortly.
                </p>
              </div>
            )}

            {paymentSuccess.method === "PAY_AT_COUNTER" && (
              <div className="bg-cream/80 border-2 border-dashed border-orange/40 rounded-2xl p-4 text-left">
                <span className="text-[10px] font-bold uppercase text-orange">
                  Counter Checkout Pass
                </span>
                <p className="text-sm font-heading font-extrabold text-espresso mt-1">
                  Table {tableNumber} &bull; {restaurant.currencySymbol}
                  {paymentSuccess.totalPaid.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  Show this screen at the exit counter cash desk.
                </p>
              </div>
            )}

            {/* Prominent CTA: Rate Your Meal */}
            <div className="pt-2 space-y-2">
              <Link
                href={`/${slug}/table/${tableNumber}/reviews`}
                className="w-full btn-primary py-3.5 text-xs font-bold flex items-center justify-center gap-2 shadow-card"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>Rate Your Meal &amp; Share Feedback &rarr;</span>
              </Link>

              <Link
                href={`/${slug}/table/${tableNumber}`}
                className="w-full btn-secondary py-2.5 text-xs block text-center"
              >
                Return to Table Home
              </Link>
            </div>
          </div>
        ) : orders.length === 0 ? (
          /* ── No Unpaid Orders ─────────────────────────────────── */
          <div className="card p-8 text-center my-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-status-ready mx-auto" />
            <h2 className="text-base font-heading font-bold text-espresso">
              No Unpaid Orders
            </h2>
            <p className="text-xs text-muted max-w-xs mx-auto">
              There are no pending charges for Table {tableNumber}.
            </p>
            <Link
              href={`/${slug}/table/${tableNumber}/menu`}
              className="btn-primary mt-4 inline-block text-xs"
            >
              Browse Menu &amp; Order
            </Link>
          </div>
        ) : (
          /* ── Active Bill & 3-Mode Payment ──────────────────────── */
          <>
            {/* Digital Receipt Card */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange" />
                  <h2 className="font-heading font-extrabold text-sm text-espresso">
                    Itemized Receipt
                  </h2>
                </div>
                <span className="text-xs font-bold text-chestnut bg-chestnut/10 px-2 py-0.5 rounded-full">
                  Table {tableNumber}
                </span>
              </div>

              {/* All Items list */}
              <div className="divide-y divide-chestnut/10">
                {orders.flatMap((order) =>
                  order.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 flex justify-between items-start text-xs"
                    >
                      <div className="pr-2">
                        <span className="font-bold text-espresso">
                          {item.nameSnapshot}
                        </span>
                        <span className="text-orange ml-1.5 font-semibold">
                          &times; {item.quantity}
                        </span>
                        {item.notes && (
                          <p className="text-[10px] text-muted italic mt-0.5">
                            &quot;{item.notes}&quot;
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-espresso tabular-nums shrink-0">
                        {restaurant.currencySymbol}
                        {(item.priceSnapshot * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal, Tax & Total */}
              <div className="pt-3 border-t border-chestnut/15 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-espresso">
                    {restaurant.currencySymbol}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Estimated Tax ({restaurant.taxRate}%)</span>
                  <span className="tabular-nums font-medium text-espresso">
                    {restaurant.currencySymbol}
                    {taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-heading font-extrabold text-base text-espresso pt-2 border-t border-chestnut/15">
                  <span>Grand Total</span>
                  <span className="text-orange tabular-nums text-lg">
                    {restaurant.currencySymbol}
                    {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Interactive Payment Methods */}
            <div className="card p-5 space-y-3">
              <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-espresso">
                Select Payment Mode
              </h3>

              <div className="space-y-2.5">
                {/* 1. Online Payment */}
                <div
                  onClick={() => setSelectedMethod("ONLINE")}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedMethod === "ONLINE"
                      ? "border-orange bg-orange/5"
                      : "border-chestnut/20 bg-cream/50 hover:border-chestnut/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange/15 text-orange flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-heading font-bold text-espresso">
                        Instant Online (UPI / Card)
                      </p>
                      <p className="text-[11px] text-muted">
                        Pay with GPay, PhonePe, Paytm, or Cards
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-orange text-white px-2 py-0.5 rounded-full font-bold">
                    Fastest
                  </span>
                </div>

                {/* 2. Cash at Table */}
                <div
                  onClick={() => setSelectedMethod("CASH_AT_TABLE")}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedMethod === "CASH_AT_TABLE"
                      ? "border-orange bg-orange/5"
                      : "border-chestnut/20 bg-cream/50 hover:border-chestnut/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-chestnut/15 text-chestnut flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-heading font-bold text-espresso">
                        Cash at Table
                      </p>
                      <p className="text-[11px] text-muted">
                        Waiter brings folder &amp; change to table
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Pay at Counter */}
                <div
                  onClick={() => setSelectedMethod("PAY_AT_COUNTER")}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedMethod === "PAY_AT_COUNTER"
                      ? "border-orange bg-orange/5"
                      : "border-chestnut/20 bg-cream/50 hover:border-chestnut/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-chestnut/15 text-chestnut flex items-center justify-center">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-heading font-bold text-espresso">
                        Pay at Counter
                      </p>
                      <p className="text-[11px] text-muted">
                        Quote Table {tableNumber} at the exit counter
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button depending on chosen mode */}
              <div className="pt-2">
                {selectedMethod === "ONLINE" && (
                  <button
                    onClick={() => setShowOnlineModal(true)}
                    className="w-full btn-primary py-3.5 text-xs font-bold flex items-center justify-center gap-2 shadow-card"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Pay {restaurant.currencySymbol}
                      {totalAmount.toFixed(2)} via UPI / Card
                    </span>
                  </button>
                )}

                {selectedMethod === "CASH_AT_TABLE" && (
                  <button
                    onClick={() => handleConfirmPayment("CASH_AT_TABLE")}
                    disabled={isProcessingPayment}
                    className="w-full bg-chestnut hover:bg-chestnut/90 active:scale-[0.99] text-white py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-card"
                  >
                    {isProcessingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Banknote className="w-4 h-4" />
                    )}
                    <span>Request Cash Payment Folder</span>
                  </button>
                )}

                {selectedMethod === "PAY_AT_COUNTER" && (
                  <button
                    onClick={() => handleConfirmPayment("PAY_AT_COUNTER")}
                    disabled={isProcessingPayment}
                    className="w-full bg-espresso hover:bg-espresso/90 active:scale-[0.99] text-cream py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-card"
                  >
                    {isProcessingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Store className="w-4 h-4 text-orange" />
                    )}
                    <span>Generate Counter Checkout Pass</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Online Checkout Modal Simulation ──────────────────────── */}
      {showOnlineModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowOnlineModal(false)}
        >
          <div
            className="w-full max-w-sm card p-6 bg-surface shadow-modal border border-chestnut/20 rounded-3xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-chestnut/15">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange" />
                <h3 className="font-heading font-extrabold text-sm text-espresso">
                  Instant UPI / Card Payment
                </h3>
              </div>
              <button
                onClick={() => setShowOnlineModal(false)}
                className="text-muted hover:text-espresso p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-2 bg-cream/70 rounded-2xl border border-chestnut/15">
              <p className="text-[11px] text-muted">Amount Payable</p>
              <p className="text-2xl font-heading font-extrabold text-orange mt-0.5">
                {restaurant.currencySymbol}
                {totalAmount.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted mt-1">
                Table {tableNumber} &bull; {orders.length} order(s)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-espresso mb-1">
                UPI ID or VPA
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@upi"
                className="w-full bg-cream border border-chestnut/20 rounded-xl px-3.5 py-2 text-xs text-espresso focus:outline-none focus:border-orange"
              />
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted bg-cream/50 p-2.5 rounded-xl border border-chestnut/10">
              <Sparkles className="w-3.5 h-3.5 text-orange shrink-0" />
              <span>
                Simulated Sandbox Gateway: Clicking &quot;Authorize Payment&quot;
                will instantly mark the bill as PAID.
              </span>
            </div>

            <button
              onClick={() => handleConfirmPayment("ONLINE")}
              disabled={isProcessingPayment}
              className="w-full btn-primary py-3 text-xs font-bold flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Authorize {restaurant.currencySymbol}
                    {totalAmount.toFixed(2)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
