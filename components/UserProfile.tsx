"use client";

import { useEffect, useState } from "react";
import { Copy, Share2, Check } from "lucide-react";
import { useAuth } from "./CartContext";

type UserData = {
  email: string;
  referralCode: string;
  referralLink: string;
  totalCommission: number;
};

export default function UserProfile() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCode = async () => {
    if (!user?.email) return;

    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/referral/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setUserData({
          email: user.email,
          referralCode: data.referralCode,
          referralLink: data.referralLink,
          totalCommission: data.totalCommission || 0,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `錯誤: ${response.status}`;
        console.error("API 返回錯誤:", errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error("生成推薦碼失敗:", err);
      setError(err instanceof Error ? err.message : "無法連接到伺服器");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateCode();
  }, [user?.email]);

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-taupe-50 p-8 text-center">
        <p className="text-taupe-600">請先登入以查看推薦碼</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-taupe-50 p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-sapphire-600 border-t-transparent" />
        <span className="text-taupe-600">載入中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
        <h3 className="font-serif text-lg font-normal text-rose-900">載入失敗</h3>
        <p className="mt-2 text-sm text-rose-700">{error}</p>
        <button
          onClick={generateCode}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
        >
          重新嘗試
        </button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-taupe-50 p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-sapphire-600 border-t-transparent" />
        <span className="text-taupe-600">準備中...</span>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    const text = `我開團購美妝產品，用我的推薦鏈接購買，我們都能獲得優惠！ 🎉\n${userData.referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareLine = () => {
    const text = `我開團購美妝產品，用我的推薦鏈接購買，我們都能獲得優惠！ 🎉\n${userData.referralLink}`;
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* 用戶信息 */}
      <div className="rounded-lg border border-taupe-200 bg-white p-6">
        <h3 className="font-serif text-lg font-normal text-ink">帳戶信息</h3>
        <p className="mt-4 text-sm text-taupe-600">
          Email: <span className="font-medium text-ink">{userData.email}</span>
        </p>
      </div>

      {/* 推薦鏈接區塊 */}
      <div className="rounded-lg border border-sapphire-200 bg-sapphire-50/50 p-6">
        <h3 className="font-serif text-lg font-normal text-ink">專屬推薦鏈接</h3>
        <p className="mt-2 text-sm text-taupe-600">
          分享您的專屬鏈接，朋友每次購買都能幫您賺取返利！無購買次數限制，就像開團購一樣 🎉
        </p>

        {/* 推薦鏈接展示 */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white p-4">
          <span className="flex-1 break-all text-sm text-sapphire-600 font-medium">
            {userData.referralLink}
          </span>
          <button
            onClick={() => copyToClipboard(userData.referralLink)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sapphire-100 text-sapphire-600 transition hover:bg-sapphire-200"
            title="複製鏈接"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>

        {/* 推薦碼 (備用) */}
        <div className="mt-3 rounded-lg bg-white p-3">
          <p className="text-xs text-taupe-600">推薦碼（如直接輸入）:</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 font-mono text-base font-bold text-sapphire-600">
              {userData.referralCode}
            </code>
            <button
              onClick={() => copyToClipboard(userData.referralCode)}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sapphire-100 text-sapphire-600 transition hover:bg-sapphire-200"
              title="複製推薦碼"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* 分享按鈕 */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={shareToWhatsApp}
            className="rounded-lg bg-sapphire-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sapphire-700"
          >
            <Share2 className="mr-2 inline h-4 w-4" />
            分享到 WhatsApp
          </button>
          <button
            onClick={shareLine}
            className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Share2 className="mr-2 inline h-4 w-4" />
            分享到 LINE
          </button>
        </div>
      </div>

      {/* 分潤成果 */}
      <div className="rounded-lg border border-taupe-200 bg-white p-6 text-center">
        <p className="text-sm text-taupe-600">累計獲得分潤</p>
        <p className="mt-4 font-serif text-4xl font-normal text-emerald-600">
          NT${userData.totalCommission}
        </p>
        <p className="mt-2 text-xs text-taupe-500">
          朋友每次購買都能獲得分潤
        </p>
      </div>

      {/* 說明 */}
      <div className="rounded-lg bg-taupe-50 p-4 text-sm text-taupe-700">
        <p className="font-medium">💡 如何獲得分潤</p>
        <ul className="mt-2 space-y-1 text-taupe-600">
          <li>✓ 分享您的推薦鏈接給朋友 (或分享推薦碼)</li>
          <li>✓ 朋友點擊鏈接或輸入推薦碼購買商品</li>
          <li>✓ <strong>每次購買</strong>都能獲得該商品的分潤金額</li>
          <li>✓ 無購買次數限制，完全可以當團購主！</li>
          <li>✓ 分潤累積顯示在上方「累計獲得分潤」</li>
        </ul>
      </div>
    </div>
  );
}
