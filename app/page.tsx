"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PackageSearch, RefreshCw } from "lucide-react";
import type { Product } from "@/lib/types";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";

const SKELETON_COUNT = 6;

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "讀取商品失敗");
      }
      if (!Array.isArray(data.products)) {
        throw new Error("商品資料格式錯誤");
      }
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "讀取商品失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-stone-900">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        {/* 頁首文案 */}
        <section className="mb-10 sm:mb-14">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-pink-600">
            Curated Selection
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-wide text-stone-900 sm:text-4xl">
            為你選好的每一件
          </h1>
          <p className="mt-2 text-sm text-stone-500 sm:text-base">
            精選美妝・下單後出貨
          </p>
        </section>

        {/* 載入中：骨架 */}
        {loading && <ProductGridSkeleton />}

        {/* 錯誤狀態 */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-stone-200 bg-white px-6 py-20 text-center">
            <PackageSearch
              className="h-10 w-10 text-stone-300"
              strokeWidth={1.2}
            />
            <p className="text-sm text-stone-500">{error}</p>
            <button
              type="button"
              onClick={loadProducts}
              className="flex items-center gap-1.5 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              <RefreshCw className="h-4 w-4" />
              重新載入
            </button>
          </div>
        )}

        {/* 無商品 */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-6 py-20 text-center">
            <p className="text-sm text-stone-400">目前沒有商品</p>
          </div>
        )}

        {/* 商品網格 */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.06,
                  duration: 0.45,
                  ease: "easeOut",
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <CartDrawer />
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white"
        >
          <div className="aspect-square animate-pulse bg-stone-200/70" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200/70" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-stone-200/70" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200/70" />
            <div className="h-9 w-full animate-pulse rounded-full bg-stone-200/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
