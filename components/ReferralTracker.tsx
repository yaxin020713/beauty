"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * 检测 URL 中的推荐码参数，并保存到 localStorage
 * 用户点击推荐链接时触发
 */
export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      // 保存推荐码到 localStorage，下单时使用
      localStorage.setItem("referralCode", ref);

      // 可选：显示通知或重定向到清洁 URL
      if (window.history.replaceState) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("ref");
        window.history.replaceState({}, document.title, cleanUrl.toString());
      }
    }
  }, [searchParams]);

  return null;
}
