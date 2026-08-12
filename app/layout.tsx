import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";

export const metadata: Metadata = {
  title: "美妝選物店",
  description: "精選商品展示與購物車結帳",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
