"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "./CartContext";
import ProductCard from "./ProductCard";
import ReferralTracker from "./ReferralTracker";

export default function StorefrontContent({
  products,
}: {
  products: Product[];
}) {
  const { mobileFilterOpen, closeMobileFilter } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["全部", ...Array.from(cats).sort()];
  }, [products]);

  const brands = useMemo(() => {
    const brandSet = new Set(products.filter((p) => p.brand).map((p) => p.brand));
    return ["全部品牌", ...Array.from(brandSet).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    // 搜尋過濾
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      );
    }

    // 品牌過濾
    if (selectedBrands.size > 0) {
      result = result.filter((product) => selectedBrands.has(product.brand));
    }

    // 分類過濾
    if (selectedCategories.size > 0) {
      result = result.filter((product) => selectedCategories.has(product.category));
    }

    return result;
  }, [products, searchTerm, selectedBrands, selectedCategories]);

  const toggleBrand = (brand: string) => {
    const newBrands = new Set(selectedBrands);
    if (newBrands.has(brand)) {
      newBrands.delete(brand);
    } else {
      newBrands.add(brand);
    }
    setSelectedBrands(newBrands);
  };

  const toggleCategory = (category: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const clearFilters = () => {
    setSelectedBrands(new Set());
    setSelectedCategories(new Set());
    setSearchTerm("");
  };

  const hasActiveFilters = selectedBrands.size > 0 || selectedCategories.size > 0 || searchTerm.trim() !== "";

  return (
    <>
      <ReferralTracker />
      <main id="shop" className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      {/* 頁首文案 */}
      <section className="mb-10 sm:mb-14">
        <p className="font-serif text-xs font-medium uppercase tracking-[0.15em] text-sapphire-600">
          VESPER&apos;S VANITY
        </p>
        <h1 className="mt-3 font-serif text-3xl font-light text-ink sm:text-4xl">
          私人梳妝台的精選清單
        </h1>
        <p className="mt-2 text-sm text-taupe-500 sm:text-base">
          精緻保養與彩妝選品 ｜ 官方正貨保證
        </p>
      </section>

      {/* 搜尋欄 */}
      <div className="mb-8 flex items-center gap-2 rounded-xl border border-taupe-200 px-4 py-3 bg-white shadow-sm">
        <Search className="h-5 w-5 text-taupe-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="搜尋商品名稱、品牌或分類..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm outline-none text-ink placeholder:text-taupe-400"
        />
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-2 py-1 text-xs font-medium text-taupe-500 hover:text-taupe-700 rounded hover:bg-taupe-100"
          >
            重設
          </button>
        )}
      </div>

      <div className="flex gap-4 md:gap-6">
        {/* 側邊欄 - 分類與品牌過濾 */}
        <aside className="hidden md:block w-40 md:w-48 flex-shrink-0">
          <div className="sticky top-20 space-y-8">
            {/* 分類過濾 */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">
                分類
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2 cursor-pointer hover:text-sapphire-600 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(category) && category !== "全部"}
                      onChange={() => {
                        if (category === "全部") {
                          setSelectedCategories(new Set());
                        } else {
                          toggleCategory(category);
                        }
                      }}
                      disabled={category === "全部"}
                      className="w-4 h-4 rounded border-taupe-300 text-sapphire-600 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-sm text-taupe-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 品牌過濾 */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">
                品牌
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {brands.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 cursor-pointer hover:text-sapphire-600 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.has(brand) && brand !== "全部品牌"}
                      onChange={() => {
                        if (brand === "全部品牌") {
                          setSelectedBrands(new Set());
                        } else {
                          toggleBrand(brand);
                        }
                      }}
                      disabled={brand === "全部品牌"}
                      className="w-4 h-4 rounded border-taupe-300 text-sapphire-600 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-sm text-taupe-700">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* 商品內容區域 */}
        <div className="flex-1">
          {/* 無商品 */}
          {products.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-taupe-300 px-6 py-20 text-center">
              <p className="text-sm text-taupe-400">目前沒有商品</p>
            </div>
          )}

          {/* 無搜尋結果 */}
          {products.length > 0 && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-taupe-300 px-6 py-20 text-center">
              <p className="text-sm text-taupe-400">未找到符合的商品</p>
            </div>
          )}

          {/* 商品網格 */}
          {filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>
      </div>

      {/* 手機版過濾抽屜 */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileFilter}
              className="fixed inset-0 z-40 bg-taupe-900/50 backdrop-blur-sm md:hidden"
            />

            {/* 過濾抽屜 */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 z-50 h-full w-72 bg-white overflow-y-auto md:hidden"
            >
              <div className="sticky top-0 bg-white border-b border-taupe-200 px-4 py-4 flex items-center justify-between">
                <h2 className="font-serif text-lg font-normal text-ink">
                  篩選
                </h2>
                <button
                  onClick={closeMobileFilter}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-taupe-100"
                  aria-label="關閉過濾"
                >
                  <X className="h-5 w-5 text-taupe-600" />
                </button>
              </div>

              <div className="space-y-6 px-4 py-6">
                {/* 分類過濾 */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">
                    分類
                  </h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-2 cursor-pointer hover:text-sapphire-600 transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.has(category) && category !== "全部"}
                          onChange={() => {
                            if (category === "全部") {
                              setSelectedCategories(new Set());
                            } else {
                              toggleCategory(category);
                            }
                          }}
                          disabled={category === "全部"}
                          className="w-4 h-4 rounded border-taupe-300 text-sapphire-600 cursor-pointer disabled:opacity-50"
                        />
                        <span className="text-sm text-taupe-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 品牌過濾 */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">
                    品牌
                  </h3>
                  <div className="space-y-2">
                    {brands.map((brand) => (
                      <label
                        key={brand}
                        className="flex items-center gap-2 cursor-pointer hover:text-sapphire-600 transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBrands.has(brand) && brand !== "全部品牌"}
                          onChange={() => {
                            if (brand === "全部品牌") {
                              setSelectedBrands(new Set());
                            } else {
                              toggleBrand(brand);
                            }
                          }}
                          disabled={brand === "全部品牌"}
                          className="w-4 h-4 rounded border-taupe-300 text-sapphire-600 cursor-pointer disabled:opacity-50"
                        />
                        <span className="text-sm text-taupe-700">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 清除過濾按鈕 */}
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      clearFilters();
                      closeMobileFilter();
                    }}
                    className="w-full rounded-xl bg-taupe-100 py-2.5 text-sm font-medium text-taupe-700 hover:bg-taupe-200 transition"
                  >
                    清除所有篩選
                  </button>
                )}

                {/* 確認按鈕 */}
                <button
                  onClick={closeMobileFilter}
                  className="w-full rounded-xl bg-taupe-900 py-2.5 text-sm font-medium text-white hover:bg-taupe-800 transition"
                >
                  確認
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
    </>
  );
}
