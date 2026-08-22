"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/types";
import { useCart } from "@/components/CartContext";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const { addToCart, openCart } = useCart();
  const imageRef = useRef<HTMLDivElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [flyingItem, setFlyingItem] = useState<{ id: string; startX: number; startY: number } | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
        }
      } catch (error) {
        console.error("載入商品失敗:", error);
      }
    };

    const fetchVariants = async () => {
      try {
        const res = await fetch(`/api/products/${productId}/variants`);
        if (res.ok) {
          const data = await res.json();
          const variantList = data.variants || [];
          setVariants(variantList);
          if (variantList.length === 1) {
            setSelectedVariant(variantList[0]);
          }
        }
      } catch (error) {
        console.error("載入選項失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchVariants();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product || (variants.length > 0 && !selectedVariant)) return;

    // 觸發飛行動畫
    const imageElement = imageRef.current;
    if (imageElement) {
      const rect = imageElement.getBoundingClientRect();
      const flyId = `fly-${Date.now()}`;

      // 確保動畫起點在可見範圍內
      if (rect.bottom > 0) {  // 圖片至少部分在視口中
        setFlyingItem({
          id: flyId,
          startX: Math.max(0, rect.left),  // 從左邊開始，但不超出左邊界
          startY: rect.top + rect.height / 2,  // 垂直中心
        });

        // 動畫完成後再加入購物車
        setTimeout(() => {
          addToCart(product, selectedVariant ? {
            variantId: selectedVariant.id,
            optionName: selectedVariant.optionName,
          } : undefined);
          openCart();
          setFlyingItem(null);
        }, 600);
        return;
      }
    }

    // 如果找不到圖片或圖片不可見，直接加入購物車（無動畫）
    addToCart(product, selectedVariant ? {
      variantId: selectedVariant.id,
      optionName: selectedVariant.optionName,
    } : undefined);
    openCart();
  };

  if (loading && !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-taupe-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-taupe-600">商品不存在</p>
        <button
          onClick={() => window.history.back()}
          className="text-sapphire-600 hover:text-sapphire-700 font-medium"
        >
          返回上頁
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 飛行動畫 */}
      {flyingItem && (
        <motion.div
          key={flyingItem.id}
          className="fixed pointer-events-none z-[9999]"
          initial={{
            left: flyingItem.startX,
            top: flyingItem.startY,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            left: "calc(100% - 40px)",
            top: "20px",
            opacity: 0.8,
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
          <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border-2 border-taupe-400 bg-white">
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

      {/* 返回按鈕 */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-taupe-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm font-medium text-taupe-600 hover:text-ink transition"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* 左側：商品圖片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div ref={imageRef} data-product-image className="aspect-square w-full rounded-3xl overflow-hidden bg-taupe-100">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-taupe-400">
                  暫無圖片
                </div>
              )}
            </div>

            {/* 分類標籤 */}
            {product.category && (
              <div className="flex gap-2">
                <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {product.category}
                </span>
                {product.brand && (
                  <span className="px-3 py-1.5 rounded-full bg-taupe-100 text-taupe-700 text-xs font-medium">
                    {product.brand}
                  </span>
                )}
              </div>
            )}
          </motion.div>

          {/* 右側：商品資訊 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            {/* 標題 */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-normal text-ink mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-semibold text-ink">
                  <span className="mr-1 text-lg font-normal text-taupe-400">
                    NT$
                  </span>
                  {product.price.toLocaleString()}
                </div>
                {product.totalSold > 0 && (
                  <div className="text-sm text-emerald-700 font-medium">
                    已售 {product.totalSold} 件
                  </div>
                )}
              </div>
            </div>

            {/* 描述 */}
            {product.description && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-taupe-600">
                  產品特色
                </h2>
                <p className="text-base leading-relaxed text-taupe-700 whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* 加入購物車按鈕 */}
            <div className="space-y-4 border-t border-taupe-200 pt-6">
              {/* 選項選擇 */}
              {variants.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold uppercase tracking-wider text-taupe-600">
                    選擇色號
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {variants.map((variant) => (
                      <motion.button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "py-2 px-3 rounded-lg text-sm font-medium transition",
                          selectedVariant?.id === variant.id
                            ? "bg-taupe-900 text-white"
                            : "bg-taupe-100 text-taupe-700 hover:bg-taupe-200"
                        )}
                      >
                        {variant.optionName}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* 加入購物車按鈕 */}
              <motion.button
                type="button"
                onClick={handleAddToCart}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                disabled={loading || (variants.length > 0 && !selectedVariant)}
                className={cn(
                  "w-full py-4 rounded-xl font-medium text-lg transition flex items-center justify-center gap-2",
                  loading || (variants.length > 0 && !selectedVariant)
                    ? "bg-taupe-300 text-taupe-600 cursor-not-allowed"
                    : "bg-taupe-900 text-white hover:bg-taupe-800"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    載入中...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                    加入預定購物車
                  </>
                )}
              </motion.button>
            </div>

            {/* 商品詳細資訊 */}
            {(product.weight_g || product.cost50 || product.cost100) && (
              <div className="border-t border-taupe-200 pt-6 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-taupe-600">
                  規格資訊
                </h3>
                <dl className="space-y-2 text-sm">
                  {product.weight_g > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-taupe-600">單瓶重量</dt>
                      <dd className="font-medium text-ink">{product.weight_g}g</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
