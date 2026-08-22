"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ShoppingCart } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/types";
import { useCart } from "@/components/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [variantsLoaded, setVariantsLoaded] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{ id: string; startX: number; startY: number } | null>(null);

  const loadVariants = async () => {
    if (variantsLoaded) return;

    try {
      const res = await fetch(`/api/products/${product.id}/variants`);
      if (res.ok) {
        const data = await res.json();
        const variantList = data.variants || [];
        setVariants(variantList);
        setVariantsLoaded(true);

        if (variantList.length === 1) {
          setSelectedVariant(variantList[0]);
          return variantList;
        } else if (variantList.length > 1) {
          return variantList;
        }
      }
    } catch (error) {
      console.error("載入選項失敗:", error);
    }
    return [];
  };

  const triggerFlyingAnimation = (button?: HTMLElement) => {
    // 尋找商品圖片元素來獲取起點位置
    const imageContainer = document.querySelector('[data-product-card-image]');
    if (!imageContainer) return;

    const rect = imageContainer.getBoundingClientRect();
    const flyId = `fly-${Date.now()}`;
    setFlyingItem({
      id: flyId,
      startX: rect.left,  // 從左邊開始
      startY: rect.top + rect.height / 2,  // 垂直中心
    });

    setTimeout(() => {
      setFlyingItem(null);
    }, 600);
  };

  const handleAddToCart = async (e?: React.MouseEvent<HTMLElement>) => {
    setLoading(true);
    try {
      // 先加載變體
      if (!variantsLoaded) {
        const loadedVariants = await loadVariants();

        // 如果有多個變體，顯示選擇器
        if (loadedVariants.length > 1) {
          setShowVariantSelector(true);
          return;
        }

        // 如果只有一個變體，自動選擇並加入
        if (loadedVariants.length === 1) {
          triggerFlyingAnimation(e?.currentTarget);
          addToCart(product, {
            variantId: loadedVariants[0].id,
            optionName: loadedVariants[0].optionName,
          });
          return;
        }

        // 如果沒有變體，直接加入
        triggerFlyingAnimation(e?.currentTarget);
        addToCart(product);
        return;
      }

      // 變體已加載
      if (variants.length > 1 && !selectedVariant) {
        setShowVariantSelector(true);
        return;
      }

      triggerFlyingAnimation(e?.currentTarget);
      addToCart(product, selectedVariant ? {
        variantId: selectedVariant.id,
        optionName: selectedVariant.optionName,
      } : undefined);
      setSelectedVariant(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 飛行動畫 */}
      {flyingItem && (
        <motion.div
          key={flyingItem.id}
          className="fixed pointer-events-none z-50"
          initial={{
            left: flyingItem.startX,
            top: flyingItem.startY,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            left: "calc(100% - 40px)",
            top: "20px",
            opacity: 0,
            scale: 0.3,
          }}
          transition={{
            duration: 0.6,
            ease: "easeInOut",
          }}
          style={{
            width: 80,
            height: 80,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-taupe-200">
            {product?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </motion.div>
      )}

      <motion.article
        whileHover={{ y: -4 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-taupe-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_16px_40px_-16px_rgba(28,25,23,0.18)]"
      >
      {/* 商品圖片 - 可點擊進入詳情頁 */}
      <Link href={`/products/${product.id}`}>
        <div data-product-card-image className="relative aspect-square w-full overflow-hidden bg-taupe-100 cursor-pointer">
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
      </Link>

      {/* 商品內容 */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="line-clamp-2 font-medium leading-snug text-ink hover:text-sapphire-600 transition cursor-pointer">
            {product.name}
          </h3>
        </Link>

        <div className="text-xl font-semibold text-ink">
          <span className="mr-0.5 align-top text-xs font-normal text-taupe-400">
            NT$
          </span>
          {product.price.toLocaleString()}
        </div>

        <div className="flex items-center gap-2 text-xs text-taupe-400">
          <span>已售 {product.totalSold} 瓶</span>
        </div>

        {/* 按鈕區域 */}
        <div className="mt-auto flex gap-2">
          <motion.button
            ref={buttonRef}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart(e as any);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white bg-taupe-900 hover:bg-taupe-800 disabled:bg-taupe-400 transition-colors duration-300"
          >
            <ShoppingCart className="h-4 w-4" strokeWidth={2} />
            {loading ? "加載中..." : "加入預定購物車"}
          </motion.button>
          <Link href={`/products/${product.id}`} className="flex-1">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-taupe-700 bg-taupe-100 hover:bg-taupe-200 transition-colors duration-300"
            >
              詳情
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </motion.button>
          </Link>
        </div>

        {/* 選項選擇彈窗 */}
        {showVariantSelector && variants.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
            >
              <h3 className="font-semibold text-lg">選擇色號</h3>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setShowVariantSelector(false);
                      setTimeout(() => {
                        triggerFlyingAnimation();
                        addToCart(product, {
                          variantId: variant.id,
                          optionName: variant.optionName,
                        });
                      }, 0);
                    }}
                    className={`p-3 rounded-xl text-sm font-medium transition ${
                      selectedVariant?.id === variant.id
                        ? "bg-taupe-900 text-white"
                        : "bg-taupe-100 text-taupe-700 hover:bg-taupe-200"
                    }`}
                  >
                    {variant.optionName}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowVariantSelector(false)}
                className="w-full py-2 text-taupe-600 font-medium"
              >
                取消
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </motion.article>
    </>
  );
}
