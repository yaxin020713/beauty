import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider, CartProvider } from "@/components/CartContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

export const metadata: Metadata = {
  title: "Vesper's Beauty Cabinet",
  description: "私人梳妝台的精選清單・精緻保養與彩妝選品｜官方正貨保證｜快速出貨",
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-taupe-100 text-taupe-900 antialiased">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
