"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UserProfile from "@/components/UserProfile";
import { useAuth } from "@/components/CartContext";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AccountPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sapphire-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* 返回按鈕 */}
          <button
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-sapphire-600 transition hover:text-sapphire-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">返回</span>
          </button>

          {/* 頁面標題 */}
          <div className="mb-10">
            <h1 className="font-serif text-3xl font-normal text-ink">
              會員專區
            </h1>
            <p className="mt-2 text-taupe-600">
              管理你的帳戶和推薦碼
            </p>
          </div>

          {user ? (
            <div className="space-y-8">
              {/* 功能選單 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => router.push("/account/orders")}
                  className="rounded-xl border-2 border-taupe-200 p-6 text-left transition hover:border-sapphire-500 hover:bg-sapphire-50"
                >
                  <h3 className="text-lg font-semibold text-ink mb-1">我的訂單</h3>
                  <p className="text-sm text-taupe-600">查看你的所有預訂單</p>
                </button>
              </div>

              {/* 會員資料 */}
              <UserProfile />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-lg bg-taupe-50 p-12 text-center">
              <p className="text-lg text-taupe-600">需要登入才能訪問此頁面</p>
              <p className="text-sm text-taupe-500">
                請在頁面右上角點擊「登入」按鈕
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
