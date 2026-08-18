"use client";

import { useEffect, useState } from "react";
import { Copy, Share2, Check } from "lucide-react";
import { useAuth } from "./CartContext";

type UserData = {
  email: string;
  referralCode: string;
  referralLink: string;
  totalReward: number;
};

export default function UserProfile() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    const generateCode = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/referral/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });

        if (response.ok) {
          const data = await response.json();
          setUserData({
            email: user.email,
            referralCode: data.referralCode,
            referralLink: data.referralLink,
            totalReward: data.totalReward || 0,
          });
        }
      } catch (error) {
        console.error("生成推薦碼失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    generateCode();
  }, [user?.email]);

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-taupe-50 p-8 text-center">
        <p className="text-taupe-600">請先登入以查看推薦碼</p>
      </div>
    );
  }

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-taupe-50 p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-sapphire-600 border-t-transparent" />
        <span className="text-taupe-600">載入中...</span>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    const text = `我用這個推薦碼，妳註冊可以獲得優惠！🎉\n\n推薦碼: ${userData.referralCode}\n點擊鏈接: ${userData.referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareLine = () => {
    const text = `我用這個推薦碼，妳註冊可以獲得優惠！🎉\n推薦碼: ${userData.referralCode}`;
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

      {/* 推薦碼區塊 */}
      <div className="rounded-lg border border-sapphire-200 bg-sapphire-50/50 p-6">
        <h3 className="font-serif text-lg font-normal text-ink">我的推薦碼</h3>
        <p className="mt-2 text-sm text-taupe-600">
          分享推薦碼給朋友，朋友首次下單時使用，你們都能獲得優惠！
        </p>

        {/* 推薦碼展示 */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white p-4">
          <code className="flex-1 font-mono text-lg font-bold text-sapphire-600">
            {userData.referralCode}
          </code>
          <button
            onClick={() => copyToClipboard(userData.referralCode)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-sapphire-100 text-sapphire-600 transition hover:bg-sapphire-200"
            title="複製推薦碼"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>

        {/* 推薦鏈接 */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white p-3">
          <span className="text-sm text-taupe-600">
            {userData.referralLink.replace(/^https?:\/\//, "")}
          </span>
          <button
            onClick={() => copyToClipboard(userData.referralLink)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-sapphire-100 text-sapphire-600 transition hover:bg-sapphire-200"
            title="複製鏈接"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
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

      {/* 推薦成果 */}
      <div className="rounded-lg border border-taupe-200 bg-white p-6 text-center">
        <p className="text-sm text-taupe-600">累計獲得返利</p>
        <p className="mt-4 font-serif text-4xl font-normal text-emerald-600">
          NT${userData.totalReward}
        </p>
        <p className="mt-2 text-xs text-taupe-500">
          每成功推薦一位新會員，獲得 NT$50 返利
        </p>
      </div>

      {/* 說明 */}
      <div className="rounded-lg bg-taupe-50 p-4 text-sm text-taupe-700">
        <p className="font-medium">💡 獎勵規則</p>
        <ul className="mt-2 space-y-1 text-taupe-600">
          <li>✓ 分享推薦碼給朋友</li>
          <li>✓ 朋友首次下單時使用推薦碼</li>
          <li>✓ 朋友確認收貨後，你獲得 NT$50 獎勵</li>
          <li>✓ 獎勵可用於下次購物</li>
        </ul>
      </div>
    </div>
  );
}
