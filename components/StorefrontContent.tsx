"use client";

import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function StorefrontContent({
  products,
}: {
  products: Product[];
}) {
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

      {/* 無商品 */}
      {products.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-6 py-20 text-center">
          <p className="text-sm text-stone-400">目前沒有商品</p>
        </div>
      )}

      {/* 商品網格 */}
      {products.length > 0 && (
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
  );
}
