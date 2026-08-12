"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "./CartContext";

export default function Header() {
  const { totalQuantity, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#FCFBF9]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* 品牌 Logo */}
        <a href="#" className="flex items-center gap-2.5" aria-label="美妝選物店">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-600/10 ring-1 ring-pink-600/20">
            <Sparkles className="h-4 w-4 text-pink-600" />
          </span>
          <span className="font-serif text-lg font-semibold tracking-wide text-stone-900">
            美妝選物店
          </span>
        </a>

        {/* 購物車按鈕（附總件數徽章） */}
        <button
          type="button"
          onClick={openCart}
          aria-label="開啟購物車"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-900/5 hover:text-stone-900"
        >
          <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
          <AnimatePresence>
            {totalQuantity > 0 && (
              <motion.span
                key={totalQuantity}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-600 px-1 text-[11px] font-bold text-white"
              >
                {totalQuantity > 99 ? "99+" : totalQuantity}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}
