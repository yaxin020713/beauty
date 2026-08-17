import type { Metadata } from "next";
import { Playfair_Display, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { AuthProvider, CartProvider } from "@/components/CartContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-tc",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vesper's Vanity",
  description: "私人梳妝台的精選清單・精緻保養與彩妝選品｜官方正貨保證｜快速出貨",
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" className={`${playfairDisplay.variable} ${notoSansTC.variable}`}>
      <body className="min-h-screen bg-taupe-100 text-ink antialiased">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
