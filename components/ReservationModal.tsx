"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X, HelpCircle } from "lucide-react";
import { useCart, useAuth } from "./CartContext";
import { cn } from "@/lib/utils";
import { SHIPPING_COSTS } from "@/lib/shipping";

type ShippingMethod = "convenience_711" | "face_to_face";

type ReservationResult = {
  orderId: string;
  message: string;
};

export default function ReservationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { cartItems, clearCart, totalPrice } = useCart();
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [store7_11, setStore7_11] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("convenience_711");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reservationResult, setReservationResult] = useState<ReservationResult | null>(null);

  const shippingFee = shippingMethod === "convenience_711" ? SHIPPING_COSTS.CONVENIENCE_711 : 0;
  const totalAmount = totalPrice + shippingFee;

  useEffect(() => {
    if (open) {
      setError("");
      setReservationResult(null);
      setSubmitting(false);

      // Auto-fill from logged-in user email
      if (user?.email) {
        setCustomerEmail(user.email);

        // Load member profile from Notion
        const loadMemberProfile = async () => {
          try {
            const response = await fetch(
              `/api/members/profile?email=${encodeURIComponent(user.email)}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.recipientName) setCustomerName(data.recipientName);
              if (data.contactPhone) setCustomerPhone(data.contactPhone);
              if (data.store711Code) setStore7_11(data.store711Code);
            }
          } catch (error) {
            console.warn("載入會員資料失敗:", error);
          }
        };

        loadMemberProfile();
      }
    }
  }, [open, user]);

  const canSubmit =
    !submitting &&
    customerName &&
    customerPhone &&
    customerEmail &&
    (shippingMethod === "face_to_face" || store7_11);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || cartItems.length === 0) return;

    setSubmitting(true);
    setError("");

    try {
      const items = cartItems.map((item) => ({
        productId: item.id,
        productName: item.name,
        variant: item.optionName ? { optionName: item.optionName } : undefined,
        quantity: item.quantity,
      }));

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerName,
          customerPhone,
          customerEmail,
          store7_11: shippingMethod === "convenience_711" ? store7_11 : undefined,
          shippingMethod,
          shippingFee,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReservationResult({
          orderId: data.orderId,
          message: data.message,
        });
        clearCart();
        setTimeout(() => {
          onClose();
          setCustomerName("");
          setCustomerPhone("");
          setCustomerEmail("");
          setStore7_11("");
          setReservationResult(null);
        }, 2000);
      } else {
        setError("預訂失敗，請稍後再試");
      }
    } catch (err) {
      console.error("預訂失敗:", err);
      setError("預訂失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />

              {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
              {/* 標題 */}
              <div className="sticky top-0 flex items-center justify-between border-b border-taupe-100 bg-white px-6 py-4">
                <h2 className="text-lg font-semibold text-ink">
                  {reservationResult ? "預訂確認" : "預訂確認"}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="關閉"
                  className="rounded-full p-2 text-taupe-400 transition hover:bg-taupe-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 內容 */}
              {reservationResult ? (
                /* 成功畫面 */
                <div className="flex flex-col items-center justify-center gap-4 px-6 py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
                    </div>
                  </motion.div>
                  <h3 className="text-center text-xl font-semibold text-ink">
                    {reservationResult.message}
                  </h3>
                  <p className="text-center text-sm text-taupe-600">
                    訂單編號：<span className="font-mono font-semibold">{reservationResult.orderId}</span>
                  </p>
                  <p className="text-center text-xs text-taupe-500">
                    即將關閉此視窗...
                  </p>
                </div>
              ) : (
                /* 預訂表單 */
                <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
                  {/* 商品清單與運費 */}
                  <div className="space-y-4 border-b border-taupe-100 pb-6">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-taupe-600 mb-3">
                        預訂商品
                      </h3>
                      <ul className="space-y-2">
                        {cartItems.map((item) => (
                          <li
                            key={`${item.id}-${item.variantId || "default"}`}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-taupe-700">
                              {item.name}
                              {item.optionName && (
                                <span className="text-taupe-500"> ({item.optionName})</span>
                              )}
                            </span>
                            <span className="font-medium text-ink">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 運費選擇 */}
                    <div className="space-y-3 pt-3">
                      <label className="text-sm font-semibold uppercase tracking-wider text-taupe-600">
                        收貨方式 *
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-taupe-200 hover:bg-taupe-50 transition">
                          <input
                            type="radio"
                            name="shipping"
                            value="convenience_711"
                            checked={shippingMethod === "convenience_711"}
                            onChange={(e) => setShippingMethod(e.target.value as ShippingMethod)}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ink">7-11 超商取貨</p>
                            <p className="text-xs text-taupe-500">+ NT$ {SHIPPING_COSTS.CONVENIENCE_711} 運費</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-taupe-200 hover:bg-taupe-50 transition">
                          <input
                            type="radio"
                            name="shipping"
                            value="face_to_face"
                            checked={shippingMethod === "face_to_face"}
                            onChange={(e) => setShippingMethod(e.target.value as ShippingMethod)}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ink">面交</p>
                            <p className="text-xs text-taupe-500">
                              免運費（
                              <a
                                href="https://lin.ee/8klCvGm"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sapphire-600 hover:text-sapphire-700 hover:underline"
                              >
                                點選 Line 聯繫小幫手洽詢面交細節
                              </a>
                              ）
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 姓名 */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold uppercase tracking-wider text-taupe-600">
                      姓名 *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl border border-taupe-200 px-4 py-3 text-base outline-none focus:border-sapphire-500 focus:ring-2 focus:ring-sapphire-500/20 bg-white"
                    />
                  </div>

                  {/* 電話 */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold uppercase tracking-wider text-taupe-600">
                      電話 *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full rounded-xl border border-taupe-200 px-4 py-3 text-base outline-none focus:border-sapphire-500 focus:ring-2 focus:ring-sapphire-500/20 bg-white"
                    />
                  </div>

                  {/* 聯絡email */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold uppercase tracking-wider text-taupe-600">
                      聯絡email *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full rounded-xl border border-taupe-200 px-4 py-3 text-base outline-none focus:border-sapphire-500 focus:ring-2 focus:ring-sapphire-500/20 bg-white"
                    />
                  </div>

                  {/* 7-11 超商編號 */}
                  {shippingMethod === "convenience_711" && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold uppercase tracking-wider text-taupe-600">
                        7-11 取貨門市編號 *
                      </label>
                      <input
                        type="text"
                        required={shippingMethod === "convenience_711"}
                        placeholder="例：807"
                        value={store7_11}
                        onChange={(e) => setStore7_11(e.target.value)}
                        className="w-full rounded-xl border border-taupe-200 px-4 py-3 text-base outline-none focus:border-sapphire-500 focus:ring-2 focus:ring-sapphire-500/20 bg-white"
                      />
                      <p className="text-xs text-taupe-500">
                        <a
                          href="https://www.ibon.com.tw/MOBILE/retail_inquiry.aspx#gsc.tab=0"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sapphire-600 hover:text-sapphire-700 hover:underline"
                        >
                          點選連結查詢7-11門市編號
                        </a>
                      </p>
                    </div>
                  )}

                  {/* 錯誤訊息 */}
                  {error && (
                    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* 預訂總額 */}
                  <div className="space-y-2 border-t border-taupe-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-taupe-600">商品小計</span>
                      <span className="font-medium text-ink">NT$ {totalPrice.toLocaleString()}</span>
                    </div>
                    {shippingFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-taupe-600">運費</span>
                        <span className="font-medium text-ink">NT$ {shippingFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-semibold pt-2 border-t border-taupe-100">
                      <span className="text-ink">預訂總額</span>
                      <span className="text-ink">NT$ {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 提交按鈕 */}
                  <motion.button
                    type="submit"
                    disabled={!canSubmit}
                    whileTap={canSubmit ? { scale: 0.98 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={cn(
                      "w-full py-4 rounded-xl font-medium text-lg transition flex items-center justify-center gap-2",
                      canSubmit
                        ? "bg-taupe-900 text-white hover:bg-taupe-800"
                        : "bg-taupe-300 text-taupe-600 cursor-not-allowed"
                    )}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      "確認預訂"
                    )}
                  </motion.button>
                </form>
              )}
            </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
