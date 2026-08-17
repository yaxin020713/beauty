"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, ShieldAlert, CheckCircle2 } from "lucide-react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "./CartContext";

export default function LoginModal() {
  const { user, login, isLoginModalOpen, closeLoginModal } = useAuth();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (isLoginModalOpen) {
      setError("");
      setSuccessMsg("");
    }
  }, [isLoginModalOpen]);

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
            className="absolute inset-0 bg-taupe-900/50 backdrop-blur-sm"
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
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-taupe-400 transition hover:bg-taupe-100 hover:text-taupe-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-8 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sapphire-600/10 text-sapphire-600 ring-1 ring-sapphire-600/20">
                <Mail className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-2xl font-normal text-ink">
                登入
              </h2>
              <p className="mt-1 text-sm text-taupe-500">
                使用 Google 帳號快速登入
              </p>
            </div>

            {successMsg ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                <div className="space-y-1">
                  {successMsg.split("\n").map((line, i) => (
                    <p key={i} className="text-sm font-medium text-taupe-800">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-center py-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    size="large"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
