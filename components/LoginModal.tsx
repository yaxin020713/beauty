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
      setError("Email 格式不正確，請重新輸入");
      return;
    }

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "yaxinzhu2002@gmail.com";
    const isAdmin = trimmed.toLowerCase() === adminEmail.toLowerCase();
    setSuccessMsg(
      isAdmin
        ? `✨ 登入成功！\n您已取得管理員權限\n(${adminEmail})`
        : `✓ 登入成功！\n已綁定為顧客\n(${trimmed})`
    );

    setTimeout(() => {
      closeLoginModal();
    }, 1500);
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
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                <div className="space-y-1">
                  {successMsg.split("\n").map((line, i) => (
                    <p key={i} className="text-sm font-medium text-stone-800">
                      {line}
                    </p>
                  ))}
                </div>
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

                <div className="space-y-3">
                  <div className="rounded-2xl bg-blue-50 p-3.5 text-xs text-blue-700 space-y-2">
                    <p className="font-semibold flex items-center gap-1">
                      👤 顧客登入
                    </p>
                    <p>輸入任意有效的 Email 地址即可作為顧客登入，可：</p>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>瀏覽所有商品</li>
                      <li>加入購物車</li>
                      <li>進行結帳購買</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-pink-50 p-3.5 text-xs text-pink-700 space-y-2">
                    <p className="font-semibold flex items-center gap-1">
                      🛡️ 管理員登入
                    </p>
                    <p>
                      使用管理員 Email：{" "}
                      <code className="bg-pink-100 px-2 py-1 rounded font-semibold">
                        yaxinzhu2002@gmail.com
                      </code>
                    </p>
                    <p>可額外使用：</p>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>上架新商品</li>
                      <li>編輯商品資訊</li>
                      <li>管理訂單</li>
                    </ul>
                  </div>
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
