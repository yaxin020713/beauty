"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Sparkles, User, LogOut, ShieldPlus, BarChart3 } from "lucide-react";
import { useAuth, useCart } from "./CartContext";
import LoginModal from "./LoginModal";
import AdminProductModal from "./AdminProductModal";
import AdminDashboard from "./AdminDashboard";

export default function Header() {
  const { totalQuantity, openCart } = useCart();
  const { user, logout, openLoginModal } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#FCFBF9]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* 品牌 Logo */}
          <a href="#" className="flex items-center gap-2.5" aria-label="美妝選物店">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-600/10 ring-1 ring-pink-600/20">
              <Sparkles className="h-4 w-4 text-pink-600" />
            </span>
            <span className="font-serif text-lg font-semibold tracking-wide text-stone-900">
              美妝選物店
            </span>
          </a>

          {/* 右側：登入 / 管理員後台 / 購物車 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === "admin" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsAdminModalOpen(true)}
                      className="hidden sm:flex items-center gap-1.5 rounded-full bg-pink-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-pink-700 active:scale-95"
                    >
                      <ShieldPlus className="h-3.5 w-3.5" />
                      <span>上架商品</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDashboardOpen(true)}
                      className="hidden sm:flex items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-stone-800 active:scale-95"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span>管理面板</span>
                    </button>
                  </>
                )}

                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-pink-100 text-pink-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                  title={`${user.role === "admin" ? "管理員" : "顧客"} - ${user.email}`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {user.email}
                  </span>
                  <span className="sm:hidden">
                    {user.role === "admin" ? "🛡️ Admin" : "👤 顧客"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="登出"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-stone-800 active:scale-95"
              >
                <User className="h-3.5 w-3.5" />
                <span>登入</span>
              </button>
            )}

            {/* 購物車按鈕（附總件數徽章） */}
            <button
              type="button"
              onClick={openCart}
              aria-label="開啟購物車"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-900/5 hover:text-stone-900"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
              <AnimatePresence>
                {totalQuantity > 0 && (
                  <motion.span
                    key={totalQuantity}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-600 px-1 text-[11px] font-bold text-white"
                  >
                    {totalQuantity > 99 ? "99+" : totalQuantity}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* 手機版管理員上架按鈕 */}
        {user?.role === "admin" && (
          <div className="sm:hidden border-t border-stone-200 bg-pink-50 px-4 py-3 flex justify-between items-center gap-2">
            <span className="text-xs text-pink-700 font-semibold">
              🛡️ 管理員模式
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="rounded-full bg-pink-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm active:scale-95 transition"
              >
                上架商品
              </button>
              <button
                type="button"
                onClick={() => setIsDashboardOpen(true)}
                className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm active:scale-95 transition"
              >
                面板
              </button>
            </div>
          </div>
        )}
      </header>

      <LoginModal />
      <AdminProductModal
        open={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={() => {
          // 重新加載頁面以獲取最新商品列表
          window.location.href = "/";
        }}
      />
      <AdminDashboard
        open={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />
    </>
  );
}
