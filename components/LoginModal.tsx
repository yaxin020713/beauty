"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, ShieldAlert, CheckCircle2 } from "lucide-react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
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

    setSuccessMsg(`✓ 登入成功！\n(${trimmed})`);

    setTimeout(() => {
      closeLoginModal();
    }, 1500);
  };

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    try {
      const decoded = jwtDecode<{ email: string }>(credentialResponse.credential!);
      const email = decoded.email;

      if (!email) {
        setError("無法從 Google 帳戶取得 Email");
        return;
      }

      const ok = login(email);
      if (!ok) {
        setError("Google 登入失敗，請重試");
        return;
      }

      setSuccessMsg(`✓ 登入成功！\n(${email})`);

      setTimeout(() => {
        closeLoginModal();
      }, 1500);
    } catch (error) {
      console.error("Google 登入解析失敗:", error);
      setError("Google 登入失敗，請重試");
    }
  };

  const handleGoogleError = () => {
    setError("Google 登入失敗，請重試");
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
                登入 / 綁定 Email
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                透過 Email 登入以購買商品
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

                <button
                  type="submit"
                  className="w-full rounded-xl bg-stone-900 py-3.5 text-sm font-medium text-white transition hover:bg-stone-800 active:scale-[0.99]"
                >
                  確認登入
                </button>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 border-t border-stone-200" />
                  <span className="text-xs text-stone-500">或</span>
                  <div className="flex-1 border-t border-stone-200" />
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    size="large"
                  />
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
