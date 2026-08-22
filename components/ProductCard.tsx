"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-taupe-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_16px_40px_-16px_rgba(28,25,23,0.18)]"
    >
      {/* 商品圖片 - 可點擊進入詳情頁 */}
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square w-full overflow-hidden bg-taupe-100 cursor-pointer">
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
        <div className="mt-auto">
          <Link href={`/products/${product.id}`}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-taupe-700 bg-taupe-100 hover:bg-taupe-200 transition-colors duration-300"
            >
              查看詳情
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
