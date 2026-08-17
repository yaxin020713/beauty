"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "./CartContext";
import CheckoutModal from "./CheckoutModal";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";

export default function CartDrawer() {
  const {
    cartItems,
    isOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    totalPrice,
    totalQuantity,
  } = useCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // 前往結帳：關閉側欄並開啟結帳 Modal
  const handleCheckoutClick = () => {
    closeCart();
    setIsCheckoutOpen(true);
  };

  // 手機：從底部上滑；桌面：從右側滑入
  const panelInitial = isDesktop ? { x: "100%" } : { y: "100%" };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50">
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40"
              onClick={closeCart}
              aria-hidden="true"
            />

            {/* 側滑欄 */}
            <motion.div
              initial={panelInitial}
              animate={{ x: 0, y: 0 }}
              exit={panelInitial}
              transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
              className={cn(
                "absolute flex flex-col bg-white shadow-2xl",
                isDesktop
                  ? "right-0 top-0 h-full w-full max-w-md"
                  : "inset-x-0 bottom-0 max-h-[85dvh] w-full rounded-t-3xl"
              )}
            >
              {/* 標題列 */}
              <div className="flex items-center justify-between border-b border-taupe-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-taupe-900">
                  <ShoppingBag className="h-5 w-5 text-sapphire-600" />
                  購物車（{totalQuantity} 件）
                </h2>
                <button
                  type="button"
                  onClick={closeCart}
                  aria-label="關閉購物車"
                  className="rounded-full p-2 text-taupe-400 transition hover:bg-taupe-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {cartItems.length === 0 ? (
                /* 空購物車 */
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-taupe-400">
                  <ShoppingBag className="h-12 w-12" strokeWidth={1.2} />
                  <p className="text-base">購物車是空的</p>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="text-sm text-sapphire-600 underline"
                  >
                    繼續逛逛
                  </button>
                </div>
              ) : (
                <>
                  {/* 商品清單 */}
                  <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    {cartItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex gap-3 border-b border-taupe-100 pb-4"
                      >
                        {/* 縮圖 */}
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-taupe-100">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-taupe-400">
                              無圖
                            </span>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium leading-snug text-taupe-900">
                              {item.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              aria-label={`移除 ${item.name}`}
                              className="rounded p-1 text-taupe-400 transition hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-taupe-500">
                            NT${item.price.toLocaleString()}・單瓶{" "}
                            {item.weight_g}g
                          </p>

                          {/* 數量控制 */}
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                aria-label="減少數量"
                                className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-full border border-taupe-200 text-taupe-600 transition hover:bg-taupe-50",
                                  item.quantity === 1 &&
                                    "hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                                )}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium text-taupe-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                aria-label="增加數量"
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-taupe-200 text-taupe-600 transition hover:bg-taupe-50"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="flex-shrink-0 text-sm font-semibold text-taupe-900">
                          NT${(item.price * item.quantity).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>

                  {/* 底部：總額與前往結帳 */}
                  <div className="space-y-2 border-t border-taupe-100 bg-taupe-50/60 px-5 py-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-taupe-600">訂單總金額</span>
                      <span className="text-2xl font-semibold text-taupe-900">
                        <span className="mr-0.5 align-top text-sm font-normal text-taupe-400">
                          NT$
                        </span>
                        {totalPrice.toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckoutClick}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-taupe-900 py-3.5 text-sm font-medium text-white transition hover:bg-taupe-700"
                    >
                      前往結帳
                      <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 結帳 Modal */}
      <CheckoutModal
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
}
