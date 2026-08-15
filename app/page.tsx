import type { Product } from "@/lib/types";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import StorefrontContent from "@/components/StorefrontContent";

async function loadProducts(): Promise<Product[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://beauty-storefront.vercel.app"
        : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/products`, {
      next: { revalidate: 60 },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? "讀取商品失敗");
    }
    if (!Array.isArray(data.products)) {
      throw new Error("商品資料格式錯誤");
    }
    return data.products;
  } catch (err) {
    console.error("Failed to load products:", err);
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
