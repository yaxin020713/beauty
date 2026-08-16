import type { Product } from "@/lib/types";
import { fetchProducts } from "@/lib/products";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import StorefrontContent from "@/components/StorefrontContent";

export const dynamic = "force-dynamic";

async function loadProducts(): Promise<Product[]> {
  try {
    console.log("[page.tsx] 正在加载商品");
    const products = await fetchProducts();
    console.log("[page.tsx] 成功加载", products.length, "个商品");
    return products;
  } catch (err) {
    console.error("[page.tsx] 加载商品失败:", err);
    return [];
  }
}

export default async function StorefrontPage() {
  const products = await loadProducts();

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-stone-900">
      <Header />
      <StorefrontContent products={products} />
      <CartDrawer />
    </div>
  );
}
