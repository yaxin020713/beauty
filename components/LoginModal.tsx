"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAuth } from "./CartContext";

export default function LoginModal() {
  const { user, login, isLoginModalOpen, closeLoginModal } = useAuth();
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (isLoginModalOpen) {
      setEmailInput(user?.email ?? "");
      setError("");
      setSuccessMsg("");
    }
  }, [isLoginModalOpen, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = emailInput.trim();

    if (!trimmed || !trimmed.includes("@")) {
      setError("請輸入有效的 Email 地址");
      return;
    }

    const ok = login(trimmed);
    if (!ok) {
      setError("登入失敗，請檢查 Email 格式");
      return;
    }

    const isAdmin = trimmed.toLowerCase() === "yaxinzhu2002@gmail.com";
    setSuccessMsg(
      isAdmin
        ? "登入成功！您已取得管理員權限 (yaxinzhu2002@gmail.com)"
        : `登入成功！已綁定 Email: ${trimmed}`
    );

    setTimeout(() => {
      closeLoginModal();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLoginModal}
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={closeLoginModal}
              aria-label="關閉視窗"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pink-600/10 text-pink-600 ring-1 ring-pink-600/20">
                <Mail className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-2xl font-semibold text-stone-900">
                顧客登入 / 綁定 Email
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                以 Email 作為您的唯一身分識別
              </p>
            </div>

            {successMsg ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <p className="text-sm font-medium text-stone-800">{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    電子郵件 (Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="例如: user@example.com 或 yaxinzhu2002@gmail.com"
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-600/20"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="rounded-2xl bg-stone-50 p-3.5 text-xs text-stone-600 space-y-1">
                  <p className="font-medium text-stone-700">💡 提示：</p>
                  <p>• 輸入任意 Email 即可作為一般顧客身分登入選購與加入購物車。</p>
                  <p className="text-pink-600 font-semibold">• 綁定 <code className="bg-pink-50 px-1 py-0.5 rounded">yaxinzhu2002@gmail.com</code> 將自動獲得管理員權限，可於後台上架商品。</p>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-stone-900 py-3.5 text-sm font-medium text-white transition hover:bg-stone-800 active:scale-[0.99]"
                >
                  確認登入 / 綁定
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
