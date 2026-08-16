import type { Product } from "@/lib/types";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import StorefrontContent from "@/components/StorefrontContent";

export const dynamic = "force-dynamic";

async function loadProducts(): Promise<Product[]> {
  try {
    console.log("[page.tsx] 正在加载商品");

    const res = await fetch(`/api/products`, {
      cache: "no-store",
    });

    console.log("[page.tsx] API 响应状态:", res.status);

    const data = await res.json();
    console.log("[page.tsx] API 响应数据:", data);

    if (!res.ok) {
      throw new Error(data?.error ?? "讀取商品失敗");
    }
    if (!Array.isArray(data.products)) {
      throw new Error("商品資料格式錯誤");
    }

    console.log("[page.tsx] 成功加载", data.products.length, "个商品");
    return data.products;
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
