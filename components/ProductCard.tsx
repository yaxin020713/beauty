"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/types";
import { useCart } from "./CartContext";
import { cn } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 載入變體資訊
  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const res = await fetch(`/api/products/${product.id}/variants`);
        if (res.ok) {
          const data = await res.json();
          const variantList = data.variants || [];
          setVariants(variantList);
          if (variantList.length === 1) {
            setSelectedVariant(variantList[0]);
          }
        }
      } catch (error) {
        console.warn("載入變體失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVariants();
  }, [product.id]);


  // 元件卸載時清除計時器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleAddToCart = () => {
    if (!selectedVariant && variants.length > 0) {
      return;
    }

    addToCart(
      product,
      variants.length > 0
        ? {
            variantId: selectedVariant!.id,
            optionName: selectedVariant!.optionName,
          }
        : undefined
    );
    setAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1400);
  };

  const canAddToCart = !loading && (variants.length === 0 || selectedVariant);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-taupe-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_16px_40px_-16px_rgba(28,25,23,0.18)]"
    >
      {/* 商品圖片 */}
      <div className="relative aspect-square w-full overflow-hidden bg-taupe-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-taupe-400">
            暫無圖片
          </div>
        )}

        {/* 分類標籤 */}
        {product.category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-taupe-600 backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>

      {/* 商品內容 */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="line-clamp-2 font-medium leading-snug text-ink">
          {product.name}
        </h3>

        <div className="text-xl font-semibold text-ink">
          <span className="mr-0.5 align-top text-xs font-normal text-taupe-400">
            NT$
          </span>
          {product.price.toLocaleString()}
        </div>

        <div className="flex items-center gap-2 text-xs text-taupe-400">
          <span>已售 {product.totalSold} 瓶</span>
        </div>

        {/* 選項選擇器 */}
        {variants.length > 1 && (
          <div className="mt-1">
            <select
              value={selectedVariant?.id || ""}
              onChange={(e) => {
                const variant = variants.find((v) => v.id === e.target.value);
                if (variant && variant.stock > 0) setSelectedVariant(variant);
              }}
              className="w-full rounded-lg border border-taupe-200 px-3 py-2 text-xs outline-none focus:border-sapphire-500 bg-white"
            >
              <option value="">選擇色號 *</option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id} disabled={variant.stock === 0}>
                  {variant.optionName}
                  {variant.stock === 0 ? " (已售完)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 加入購物車 */}
        <motion.button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart || loading}
          whileTap={canAddToCart ? { scale: 0.94 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={cn(
            "mt-auto flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white transition-colors duration-300",
            added ? "bg-navy-800" : "bg-taupe-900 hover:bg-taupe-700 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            "載入中..."
          ) : added ? (
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
