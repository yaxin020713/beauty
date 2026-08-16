"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function StorefrontContent({
  products,
}: {
  products: Product[];
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;

    const query = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
  }, [products, searchTerm]);

  return (
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

      {/* 搜尋欄 */}
      <div className="mb-8 flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-3 bg-white shadow-sm">
        <Search className="h-5 w-5 text-stone-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="搜尋商品名稱、品牌或分類..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm outline-none text-stone-900 placeholder:text-stone-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="px-2 py-1 text-xs font-medium text-stone-500 hover:text-stone-700 rounded hover:bg-stone-100"
          >
            清除
          </button>
        )}
      </div>

      {/* 無商品 */}
      {products.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-6 py-20 text-center">
          <p className="text-sm text-stone-400">目前沒有商品</p>
        </div>
      )}

      {/* 無搜尋結果 */}
      {products.length > 0 && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-6 py-20 text-center">
          <p className="text-sm text-stone-400">未找到符合的商品</p>
        </div>
      )}

      {/* 商品網格 */}
      {filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filteredProducts.map((product, index) => (
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
  );
}
