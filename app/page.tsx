import type { Product } from "@/lib/types";
import { fetchProducts } from "@/lib/products";
import {
  FREE_SHIPPING_THRESHOLD,
  DISCOUNT_THRESHOLD,
  DISCOUNT_AMOUNT,
  SHIPPING_COSTS,
} from "@/lib/shipping";
import Header from "@/components/Header";
import PromoBanner from "@/components/PromoBanner";
import CartDrawer from "@/components/CartDrawer";
import StorefrontContent from "@/components/StorefrontContent";
import Footer from "@/components/Footer";

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
    <div className="min-h-screen bg-taupe-100 text-ink">
      <Header />
      <PromoBanner
        freeShippingThreshold={FREE_SHIPPING_THRESHOLD}
        discountThreshold={DISCOUNT_THRESHOLD}
        discountAmount={DISCOUNT_AMOUNT}
        belowThresholdShippingFee={SHIPPING_COSTS.CONVENIENCE_711}
        ctaHref="#shop"
        imageSrc="/images/banner.jpg"
      />
      <StorefrontContent products={products} />
      <Footer />
      <CartDrawer />
    </div>
  );
}
