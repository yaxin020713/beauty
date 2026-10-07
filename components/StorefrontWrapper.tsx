"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "./CartContext";
import LoginModal from "./LoginModal";

export default function StorefrontWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setReferralCode } = useCart();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 從 URL 讀取推薦碼（?ref=CODE）
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams, setReferralCode]);

  return (
    <>
      {children}
      <LoginModal />
    </>
  );
}
