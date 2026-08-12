"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "./CartContext";
import { cn } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 元件卸載時清除計時器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1400);
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_16px_40px_-16px_rgba(28,25,23,0.18)]"
    >
      {/* 商品圖片 */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
            暫無圖片
          </div>
        )}

        {/* 分類標籤 */}
        {product.category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-stone-600 backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>

      {/* 商品內容 */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="line-clamp-2 font-medium leading-snug text-stone-900">
          {product.name}
        </h3>

        <div className="text-xl font-semibold text-stone-900">
          <span className="mr-0.5 align-top text-xs font-normal text-stone-400">
            NT$
          </span>
          {product.price.toLocaleString()}
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span>單瓶 {product.weight_g}g</span>
          <span className="h-1 w-1 rounded-full bg-stone-300" />
          <span>已售 {product.totalSold} 瓶</span>
        </div>

        {/* 加入購物車 */}
        <motion.button
          type="button"
          onClick={handleAddToCart}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={cn(
            "mt-auto flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white transition-colors duration-300",
            added ? "bg-pink-600" : "bg-stone-900 hover:bg-stone-700"
          )}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" strokeWidth={2.5} />
              已加入
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              加入購物車
            </>
          )}
        </motion.button>
      </div>
    </motion.article>
  );
}
