"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Sparkles, User, LogOut, ShieldPlus, BarChart3, Menu } from "lucide-react";
import { useAuth, useCart } from "./CartContext";
import LoginModal from "./LoginModal";
import AdminProductModal from "./AdminProductModal";
import AdminDashboard from "./AdminDashboard";

export default function Header() {
  const { totalQuantity, openCart, openMobileFilter } = useCart();
  const { user, logout, openLoginModal } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-taupe-200/70 bg-taupe-100/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* 左側：手機版過濾按鈕 + 品牌 Logo */}
          <div className="flex min-w-0 items-center gap-2">
            {/* 手機版過濾按鈕 */}
            <button
              onClick={openMobileFilter}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-full hover:bg-taupe-100 transition flex-shrink-0"
              aria-label="開啟篩選"
              title="篩選"
            >
              <Menu className="h-5 w-5 text-taupe-600" />
            </button>

            <a href="#" className="flex min-w-0 items-center gap-2.5" aria-label="Vesper's Vanity">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sapphire-600/10 ring-1 ring-sapphire-600/20">
                <Sparkles className="h-4 w-4 text-sapphire-600" />
              </span>
              <span className="truncate font-serif text-sm font-semibold uppercase tracking-[0.06em] text-ink sm:text-lg sm:tracking-[0.15em]">
                Vesper&apos;s Vanity
              </span>
            </a>
          </div>

          {/* 右側：登入 / 管理員後台 / 購物車 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === "admin" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsAdminModalOpen(true)}
                      className="hidden sm:flex items-center gap-1.5 rounded-full bg-navy-800 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-navy-900 active:scale-95"
                    >
                      <ShieldPlus className="h-3.5 w-3.5" />
                      <span>上架商品</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDashboardOpen(true)}
                      className="hidden sm:flex items-center gap-1.5 rounded-full bg-taupe-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-taupe-800 active:scale-95"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span>管理面板</span>
                    </button>
                  </>
                )}

                <div
                  className="flex items-center gap-1.5 rounded-full bg-taupe-100 text-taupe-700 px-3 py-1.5 text-xs font-medium"
                  title={user.email}
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {user.email}
                  </span>
                  <span className="sm:hidden">已登入</span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="登出"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-taupe-400 hover:bg-taupe-200 hover:text-taupe-700 transition active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="flex items-center gap-1.5 rounded-full bg-taupe-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-taupe-800 active:scale-95"
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
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-taupe-700 transition hover:bg-taupe-900/5 hover:text-ink"
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
                    className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-navy-800 px-1 text-[11px] font-bold text-white"
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
          <div className="sm:hidden border-t border-taupe-200 bg-sapphire-50 px-4 py-3 flex justify-between items-center gap-2">
            <span className="text-xs text-sapphire-700 font-semibold">
              🛡️ 管理員模式
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="rounded-full bg-navy-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm active:scale-95 transition"
              >
                上架商品
              </button>
              <button
                type="button"
                onClick={() => setIsDashboardOpen(true)}
                className="rounded-full bg-taupe-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm active:scale-95 transition"
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
