"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  Copy,
  CreditCard,
  X,
  Truck,
  Package,
} from "lucide-react";
import { useCart } from "./CartContext";
import { cn } from "@/lib/utils";
import { BANK_INFO } from "@/lib/bank";
import { SHIPPING_COSTS, type ShippingMethod } from "@/lib/shipping";

type OrderResult = {
  orderId: string;
  totalPrice: number;
  totalItemCount: number;
};

export default function CheckoutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { cartItems, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentLast5, setPaymentLast5] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("convenience_711");
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 每次開啟時重置狀態
  useEffect(() => {
    if (open) {
      setError("");
      setOrderResult(null);
      setSubmitting(false);
      setSelectedStore("");
    }
  }, [open]);

  // 計算小計（不含運費）
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // 計算運費
  const shippingFee = shippingMethod === "convenience_711" ? SHIPPING_COSTS.CONVENIENCE_711 : SHIPPING_COSTS.FACE_TO_FACE;

  // 計算總額（含運費）
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    // 驗證 7-11 取貨是否選擇門市
    if (shippingMethod === "convenience_711" && !selectedStore) {
      setError("請選擇 7-11 超商門市");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          paymentLast5,
          shippingMethod,
          selectedStore: shippingMethod === "convenience_711" ? selectedStore : null,
          shippingFee,
          items: cartItems.map(
            ({ id, name, price, weight_g, quantity }) => ({
              productId: id,
              name,
              price,
              weight_g,
              quantity,
            })
          ),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "送出失敗，請稍後再試");
        return;
      }

      setOrderResult({
        orderId: data.orderId,
        totalPrice: data.totalPrice,
        totalItemCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      });
      clearCart();
    } catch {
      setError("網路連線異常，請再試一次");
    } finally {
      setSubmitting(false);
    }
  };

  // 一鍵複製銀行帳號（非 HTTPS 環境自動改用舊式 execCommand 方式）
  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BANK_INFO.account);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = BANK_INFO.account;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  // 元件卸載時清理複製提示的計時器
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && (
        <div className="fixed inset-0 z-[60]">
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

          {/* 結帳卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4"
          >
            <div className="w-full max-h-[90dvh] sm:max-h-[95dvh] rounded-t-3xl bg-white shadow-2xl sm:max-w-sm sm:rounded-3xl flex flex-col overflow-hidden">
              {/* 標題列 */}
              <div className="flex items-center justify-between border-b border-taupe-100 px-5 py-4 flex-shrink-0">
                <h2 className="text-base font-semibold text-ink">結帳</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="關閉結帳視窗"
                  className="rounded-full p-2 text-taupe-400 transition hover:bg-taupe-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {orderResult ? (
                /* 訂單成立 */
                <div className="flex-1 overflow-y-auto flex flex-col items-center gap-3 px-6 py-10 text-center justify-center">
                  <CheckCircle2
                    className="h-12 w-12 text-emerald-500"
                    strokeWidth={1.5}
                  />
                  <p className="text-base font-semibold text-ink">
                    🎉 訂單已送出！
                  </p>
                  <p className="text-sm leading-relaxed text-taupe-600">
                    已收到您的轉帳末五碼資訊，確認核帳後將立即為您安排叫貨。
                  </p>
                  <p className="text-sm text-taupe-500">
                    合計 NT${orderResult.totalPrice.toLocaleString()}・
                    共 {orderResult.totalItemCount} 件
                  </p>
                  <p className="text-xs text-taupe-400">
                    訂單編號：{orderResult.orderId}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-2 w-full rounded-full bg-taupe-900 py-3 text-sm font-medium text-white transition hover:bg-taupe-700"
                  >
                    完成
                  </button>
                </div>
              ) : (
                /* 結帳表單 */
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3 px-5 py-5">
                  {/* 訂單摘要 */}
                  <div className="space-y-1 rounded-xl bg-taupe-50 px-4 py-3 text-sm">
                    <div className="flex justify-between text-taupe-500">
                      <span>商品小計</span>
                      <span className="font-medium text-ink">
                        NT${subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-taupe-500">
                      <span>運費</span>
                      <span className="font-medium text-ink">
                        {shippingFee > 0 ? `NT$${shippingFee}` : "免運"}
                      </span>
                    </div>
                    <div className="border-t border-taupe-200 pt-1 mt-1 flex justify-between">
                      <span className="font-medium text-ink">訂單總額</span>
                      <span className="font-medium text-ink">
                        NT${total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-taupe-500 text-xs">
                      <span>品項數量</span>
                      <span className="font-medium text-ink">
                        {cartItems.reduce((sum, i) => sum + i.quantity, 0)} 件
                      </span>
                    </div>
                  </div>

                  {/* 收貨方式選擇 */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink">
                      收貨方式
                    </p>
                    <div className="space-y-2">
                      {/* 7-11 超商取貨 */}
                      <label className="flex items-start gap-3 p-3 border border-taupe-200 rounded-xl cursor-pointer hover:bg-taupe-50 transition">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value="convenience_711"
                          checked={shippingMethod === "convenience_711"}
                          onChange={(e) => {
                            setShippingMethod(e.target.value as ShippingMethod);
                            setSelectedStore("");
                          }}
                          className="mt-1 w-4 h-4 text-sapphire-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-sapphire-600" />
                            <span className="font-medium text-ink">7-11 超商取貨</span>
                            <span className="text-xs text-sapphire-600 font-medium">+NT$60</span>
                          </div>
                          <p className="text-xs text-taupe-500 mt-1">
                            請填寫證件姓名，否則無法取貨
                          </p>
                        </div>
                      </label>

                      {/* 面交 */}
                      <label className="flex items-start gap-3 p-3 border border-taupe-200 rounded-xl cursor-pointer hover:bg-taupe-50 transition">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value="face_to_face"
                          checked={shippingMethod === "face_to_face"}
                          onChange={(e) => setShippingMethod(e.target.value as ShippingMethod)}
                          className="mt-1 w-4 h-4 text-sapphire-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-ink">面交</span>
                            <span className="text-xs text-emerald-600 font-medium">免運</span>
                          </div>
                          <p className="text-xs text-taupe-500 mt-1">
                            需先聯繫小幫手確認交貨時間與地點
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 銀行轉帳資訊 */}
                  <div className="bg-black text-white p-4 rounded-lg">
                    <p className="text-sm font-bold mb-3">銀行轉帳資訊</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-300 mb-1">銀行代碼：</p>
                        <p className="text-white font-bold text-base">{BANK_INFO.code}（{BANK_INFO.bankName}）</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-300 mb-1">銀行帳號：</p>
                        <div className="flex items-center justify-between">
                          <p className="text-white font-bold text-lg font-mono">{BANK_INFO.account}</p>
                          <button
                            type="button"
                            onClick={handleCopyAccount}
                            className="ml-3 flex items-center gap-1 bg-white text-ink px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200 transition"
                          >
                            {copied ? (
                              <>
                                <CheckCheck className="h-4 w-4" />
                                已複製
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                複製
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7-11 門市選擇 */}
                  {shippingMethod === "convenience_711" && (
                    <div className="space-y-2">
                      <label htmlFor="store-input" className="text-xs font-bold uppercase tracking-wider text-ink block">
                        7-11 門市店號 *
                      </label>
                      <input
                        id="store-input"
                        type="text"
                        required
                        placeholder="例：110817 或 查詢店號 https://emap.pcsc.com.tw"
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value.trim())}
                        className="w-full rounded-xl border border-taupe-200 px-4 py-3 text-sm outline-none transition focus:border-sapphire-500"
                      />
                      <p className="text-xs text-taupe-500">
                        💡 點擊{" "}
                        <a
                          href="https://www.ibon.com.tw/mobile/retail_inquiry.aspx"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sapphire-600 underline hover:text-sapphire-700 font-medium"
                        >
                          連結
                        </a>
                        {" "}查詢 7-11 門市店號
                      </p>
                    </div>
                  )}

                  {/* 面交警告 */}
                  {shippingMethod === "face_to_face" && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                      <div>
                        <p className="font-medium mb-1">
                          ⚠️ 請先聯繫小幫手確認面交詳細資訊
                        </p>
                        <p>
                          如未與小幫手聯繫交貨細節請勿下單面交選項。{" "}
                          <a
                            href="https://line.me/ti/p/pYYPGYQMAm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline hover:text-amber-900"
                          >
                            點擊連結加入 Line 好友
                          </a>
                          {" "}聯繫面交詳細資訊。
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="姓名 *"
                    className="w-full rounded-xl border border-taupe-200 px-4 py-3 text-sm outline-none transition focus:border-sapphire-500"
                  />
                  <input
                    type="tel"
                    required
                    maxLength={20}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="電話 *"
                    className="w-full rounded-xl border border-taupe-200 px-4 py-3 text-sm outline-none transition focus:border-sapphire-500"
                  />
                  {/* 匯款提醒 */}
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                    <p>
                      請於 24 小時內完成轉帳，並在下方填寫您的轉帳帳號後五碼。小幫手核帳無誤後將立即為您安排叫貨！
                    </p>
                  </div>

                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe-400" />
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={5}
                      value={paymentLast5}
                      onChange={(e) =>
                        setPaymentLast5(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="轉帳末五碼 *"
                      className="w-full rounded-xl border border-taupe-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-sapphire-500"
                    />
                  </div>
                  <p className="text-xs text-taupe-400">
                    請輸入轉帳帳號末五碼，方便我們核對款項
                  </p>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting || cartItems.length === 0 || (shippingMethod === "convenience_711" && !selectedStore)}
                    className={cn(
                      "w-full rounded-full py-3 text-sm font-medium text-white transition",
                      "bg-taupe-900 hover:bg-taupe-700 disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {submitting ? "送出中…" : `確認送出訂單（NT$${total.toLocaleString()}）`}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* 已複製帳號 Toast */}
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[70] flex justify-center">
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="rounded-full bg-taupe-900 px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            已複製帳號！
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
