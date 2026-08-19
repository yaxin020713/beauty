"use client";

import { useEffect, useState } from "react";
import { Copy, Share2, Check, ChevronDown, Info } from "lucide-react";
import { useAuth } from "./CartContext";
import MembershipLevelModal from "./MembershipLevelModal";
import CommissionInfoModal from "./CommissionInfoModal";

type UserData = {
  email: string;
  referralCode: string;
  referralLink: string;
  totalCommission: number;
  availableCommission: number;
  pendingCommission: number;
  birthday?: string;
  address?: string;
  bankCode?: string;
  bankAccount?: string;
  store711Code?: string;
  recipientName?: string;
  contactPhone?: string;
  membershipLevel: string;
  totalSpending: number;
};

type CommissionRecord = {
  orderId: string;
  date: string;
  totalPrice: number;
  commission: number;
  itemsDetail: string;
  status: string;
  credited: boolean;
  note: string;
};

type WithdrawalRecord = {
  requestDate: string;
  payoutAmount: number;
  status: string;
  note: string;
};

export default function UserProfile() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editBirthday, setEditBirthday] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editBankCode, setEditBankCode] = useState("");
  const [editBankAccount, setEditBankAccount] = useState("");
  const [editStore711Code, setEditStore711Code] = useState("");
  const [editRecipientName, setEditRecipientName] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showCommissionInfo, setShowCommissionInfo] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");
  const [commissionRecords, setCommissionRecords] = useState<CommissionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [commissionHistoryError, setCommissionHistoryError] = useState("");
  const [withdrawalRecords, setWithdrawalRecords] = useState<WithdrawalRecord[]>([]);
  const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(false);
  const [withdrawalHistoryError, setWithdrawalHistoryError] = useState("");

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
          availableCommission: data.availableCommission || 0,
          pendingCommission: data.pendingCommission || 0,
          birthday: data.birthday,
          address: data.address,
          bankCode: data.bankCode,
          bankAccount: data.bankAccount,
          membershipLevel: data.membershipLevel || "銅級",
          totalSpending: data.totalSpending || 0,
          store711Code: data.store711Code,
          recipientName: data.recipientName,
          contactPhone: data.contactPhone,
        });
        // 初始化編輯表單
        setEditBirthday(data.birthday || "");
        setEditAddress(data.address || "");
        setEditBankCode(data.bankCode || "");
        setEditBankAccount(data.bankAccount || "");
        setEditStore711Code(data.store711Code || "");
        setEditRecipientName(data.recipientName || "");
        setEditContactPhone(data.contactPhone || "");

        // 載入分潤明細與提現紀錄
        await Promise.all([
          fetchCommissionHistory(user.email),
          fetchWithdrawalHistory(user.email),
        ]);
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

  const handleWithdraw = async (withdrawAmount: number) => {
    if (!user?.email) return;

    if (!userData?.bankCode || !userData?.bankAccount) {
      setError("請先在會員檔案中填寫銀行帳號");
      return;
    }

    const confirmed = window.confirm(
      `確認提現 NT$${withdrawAmount} 到銀行帳號 ${userData.bankCode}-${userData.bankAccount}？\n(將於 1-3 個工作天內匯入)`
    );

    if (!confirmed) return;

    setWithdrawing(true);
    setWithdrawMsg("");

    try {
      const response = await fetch("/api/members/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "提現失敗");
        return;
      }

      setWithdrawMsg(`✓ ${data.message}`);
      // 重新載入分潤資料
      setTimeout(() => {
        generateCode();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提現失敗");
    } finally {
      setWithdrawing(false);
    }
  };

  const fetchCommissionHistory = async (email: string) => {
    setCommissionHistoryError("");
    try {
      const response = await fetch(
        `/api/members/commission-history?email=${encodeURIComponent(email)}`
      );
      const data = await response.json().catch(() => null);
      if (response.ok) {
        setCommissionRecords(data?.records || []);
      } else {
        console.error("載入分潤明細失敗:", data?.error);
        setCommissionHistoryError(data?.error || "載入分潤明細失敗");
      }
    } catch (err) {
      console.error("載入分潤明細失敗:", err);
      setCommissionHistoryError(err instanceof Error ? err.message : "載入分潤明細失敗");
    }
  };

  const fetchWithdrawalHistory = async (email: string) => {
    setWithdrawalHistoryError("");
    try {
      const response = await fetch(
        `/api/members/withdrawal-history?email=${encodeURIComponent(email)}`
      );
      const data = await response.json().catch(() => null);
      if (response.ok) {
        setWithdrawalRecords(data?.records || []);
      } else {
        console.error("載入提現紀錄失敗:", data?.error);
        setWithdrawalHistoryError(data?.error || "載入提現紀錄失敗");
      }
    } catch (err) {
      console.error("載入提現紀錄失敗:", err);
      setWithdrawalHistoryError(err instanceof Error ? err.message : "載入提現紀錄失敗");
    }
  };

  const saveProfile = async () => {
    if (!user?.email) return;

    setEditLoading(true);
    try {
      const response = await fetch("/api/members/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          birthday: editBirthday,
          address: editAddress,
          bankCode: editBankCode,
          bankAccount: editBankAccount,
          store711Code: editStore711Code,
          recipientName: editRecipientName,
          contactPhone: editContactPhone,
        }),
      });

      if (response.ok) {
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                birthday: editBirthday,
                address: editAddress,
                bankCode: editBankCode,
                bankAccount: editBankAccount,
                store711Code: editStore711Code,
                recipientName: editRecipientName,
                contactPhone: editContactPhone,
              }
            : null
        );
        setEditing(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "保存失敗，請稍後再試");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失敗");
    } finally {
      setEditLoading(false);
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
      {/* 帳戶和會員信息 */}
      <div className="rounded-lg border border-taupe-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-normal text-ink">會員檔案</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-sapphire-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-sapphire-700"
            >
              編輯
            </button>
          )}
        </div>

        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveProfile();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-taupe-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={userData.email}
                disabled
                className="w-full rounded-lg border border-taupe-200 bg-taupe-50 px-3 py-2 text-sm text-taupe-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-taupe-700 mb-1">
                  預設收件姓名（結帳時可修改）
                </label>
                <input
                  type="text"
                  value={editRecipientName}
                  onChange={(e) => setEditRecipientName(e.target.value)}
                  disabled={editLoading}
                  placeholder="請輸入姓名"
                  className="w-full rounded-lg border border-taupe-200 px-3 py-2 text-sm focus:border-sapphire-500 focus:ring-1 focus:ring-sapphire-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-taupe-700 mb-1">
                  預設聯絡電話（結帳時可修改）
                </label>
                <input
                  type="tel"
                  value={editContactPhone}
                  onChange={(e) => setEditContactPhone(e.target.value)}
                  disabled={editLoading}
                  placeholder="請輸入電話"
                  className="w-full rounded-lg border border-taupe-200 px-3 py-2 text-sm focus:border-sapphire-500 focus:ring-1 focus:ring-sapphire-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-taupe-700 mb-1">
                  生日
                </label>
                <div className="w-full overflow-hidden rounded-lg border border-taupe-200 focus-within:border-sapphire-500 focus-within:ring-1 focus-within:ring-sapphire-500">
                  <input
                    type="date"
                    value={editBirthday}
                    onChange={(e) => setEditBirthday(e.target.value)}
                    disabled={editLoading}
                    className="block w-full min-w-0 border-0 px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-taupe-700 mb-1">
                  會員等級
                </label>
                <button
                  type="button"
                  onClick={() => setShowLevelModal(true)}
                  disabled={editLoading}
                  className="w-full rounded-lg border border-taupe-200 bg-taupe-50 px-3 py-2 text-sm font-medium text-ink transition hover:bg-taupe-100 disabled:opacity-50 flex items-center justify-between"
                >
                  <span>{userData.membershipLevel}</span>
                  <Info className="h-4 w-4 text-sapphire-600" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-taupe-700 mb-1">
                預設收件地址（結帳時可修改）
              </label>
              <textarea
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                disabled={editLoading}
                placeholder="請輸入完整地址"
                rows={2}
                className="w-full rounded-lg border border-taupe-200 px-3 py-2 text-sm focus:border-sapphire-500 focus:ring-1 focus:ring-sapphire-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-taupe-700 mb-1">
                  銀行代碼
                </label>
                <input
                  type="text"
                  value={editBankCode}
                  onChange={(e) => setEditBankCode(e.target.value)}
                  disabled={editLoading}
                  placeholder="例：807"
                  className="w-full rounded-lg border border-taupe-200 px-3 py-2 text-sm focus:border-sapphire-500 focus:ring-1 focus:ring-sapphire-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-taupe-700 mb-1">
                  銀行帳號
                </label>
                <input
                  type="text"
                  value={editBankAccount}
                  onChange={(e) => setEditBankAccount(e.target.value)}
                  disabled={editLoading}
                  placeholder="不含空格"
                  className="w-full rounded-lg border border-taupe-200 px-3 py-2 text-sm focus:border-sapphire-500 focus:ring-1 focus:ring-sapphire-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-taupe-700 mb-1">
                預設 7-11 超商取貨店號（結帳時可修改）
              </label>
              <input
                type="text"
                value={editStore711Code}
                onChange={(e) => setEditStore711Code(e.target.value)}
                disabled={editLoading}
                placeholder="例：110817"
                className="w-full rounded-lg border border-taupe-200 px-3 py-2 text-sm focus:border-sapphire-500 focus:ring-1 focus:ring-sapphire-500"
              />
              <p className="text-xs text-taupe-500 mt-2">
                💡 點擊{" "}
                <a
                  href="https://www.ibon.com.tw/mobile/retail_inquiry.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sapphire-600 underline hover:text-sapphire-700 font-medium"
                >
                  連結
                </a>
                {" "}查詢 7-11 門市店號
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={editLoading}
                className="flex-1 rounded-lg border border-taupe-200 py-2 text-sm font-medium text-taupe-700 transition hover:bg-taupe-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="flex-1 rounded-lg bg-sapphire-600 py-2 text-sm font-medium text-white transition hover:bg-sapphire-700 disabled:opacity-50"
              >
                {editLoading ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-taupe-600">Email:</span>
              <span className="text-sm font-medium text-ink">{userData.email}</span>
            </div>

            {/* 會員等級與進度 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-taupe-600">會員等級:</span>
                <button
                  onClick={() => setShowLevelModal(true)}
                  className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
                >
                  {userData.membershipLevel}
                  <Info className="h-4 w-4" />
                </button>
              </div>

              {/* 消費金額 */}
              <div className="flex justify-between mb-2 text-xs text-taupe-600">
                <span>本年消費金額</span>
                <span className="font-medium text-ink">NT${userData.totalSpending}</span>
              </div>

              {/* 進度條 */}
              <div className="h-2 overflow-hidden rounded-full bg-taupe-100 mb-2">
                {(() => {
                  const tiers = [
                    { name: "銅級", threshold: 0 },
                    { name: "銀級", threshold: 3000 },
                    { name: "金級", threshold: 5000 },
                    { name: "白金級", threshold: 10000 },
                  ];
                  const currentTierIdx = tiers.findIndex((t) => t.name === userData.membershipLevel);
                  const nextTier = currentTierIdx < tiers.length - 1 ? tiers[currentTierIdx + 1] : null;
                  const maxThreshold = nextTier?.threshold || 10000;
                  const percentage = Math.min(100, (userData.totalSpending / maxThreshold) * 100);
                  return (
                    <div
                      className="h-full bg-emerald-600 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  );
                })()}
              </div>

              {/* 升級說明 */}
              {(() => {
                const tiers = [
                  { name: "銅級", threshold: 0 },
                  { name: "銀級", threshold: 3000 },
                  { name: "金級", threshold: 5000 },
                  { name: "白金級", threshold: 10000 },
                ];
                const currentTierIdx = tiers.findIndex((t) => t.name === userData.membershipLevel);
                const nextTier = currentTierIdx < tiers.length - 1 ? tiers[currentTierIdx + 1] : null;
                const remaining = nextTier ? Math.max(0, nextTier.threshold - userData.totalSpending) : 0;

                return (
                  <p className="text-xs text-taupe-600">
                    {nextTier ? (
                      <>再消費 <span className="font-medium text-sapphire-600">NT${remaining}</span> 即可升級至 <span className="font-medium">{nextTier.name}</span></>
                    ) : (
                      <span className="text-emerald-600 font-medium">已達最高等級 🎉</span>
                    )}
                  </p>
                );
              })()}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-taupe-600">生日:</span>
              <span className="text-sm font-medium text-ink">
                {userData.birthday || "未填寫"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-taupe-600">預設收件地址:</span>
              <span className="text-sm font-medium text-ink">
                {userData.address || "未填寫"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-taupe-600">銀行帳號:</span>
              <span className="text-sm font-medium text-ink">
                {userData.bankCode && userData.bankAccount
                  ? `${userData.bankCode}-${userData.bankAccount}`
                  : "未填寫"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 會員等級詳情彈窗 */}
      {userData && (
        <MembershipLevelModal
          isOpen={showLevelModal}
          onClose={() => setShowLevelModal(false)}
          currentLevel={userData.membershipLevel}
          currentSpending={userData.totalSpending}
          currentYear={new Date().getFullYear()}
        />
      )}

      <CommissionInfoModal
        isOpen={showCommissionInfo}
        onClose={() => setShowCommissionInfo(false)}
      />

      {/* 推薦鏈接區塊 */}
      <div className="rounded-lg border border-sapphire-200 bg-sapphire-50/50 p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-serif text-lg font-normal text-ink">專屬推薦鏈接</h3>
          <button
            onClick={() => setShowCommissionInfo(true)}
            className="flex items-center gap-1 text-xs font-medium text-sapphire-600 transition hover:text-sapphire-700"
          >
            <Info className="h-4 w-4" />
            分潤機制說明
          </button>
        </div>
        <p className="mt-2 text-sm text-taupe-600">
          分享您的專屬鏈接，朋友每次購買都能幫您賺取分潤！無購買次數限制，就像開團購一樣 🎉
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
      <div className="rounded-lg border border-taupe-200 bg-white p-6">
        <h3 className="font-serif text-lg font-normal text-ink mb-4">分潤成果</h3>

        {withdrawMsg && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {withdrawMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-xs text-emerald-600 mb-1">待提現分潤</p>
            <p className="text-2xl font-bold text-emerald-600">
              NT${userData.availableCommission}
            </p>
            <p className="text-xs text-taupe-400 mt-1">
              歷史累計 NT${userData.totalCommission}
            </p>
          </div>
          {userData.pendingCommission > 0 && (
            <div className="rounded-lg bg-sapphire-50 p-4">
              <p className="text-xs text-sapphire-600 mb-1">撥款處理中</p>
              <p className="text-2xl font-bold text-sapphire-600">
                NT${userData.pendingCommission}
              </p>
            </div>
          )}
        </div>

        {userData.availableCommission >= 500 && (
          <button
            onClick={() => handleWithdraw(userData.availableCommission)}
            disabled={withdrawing}
            className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {withdrawing ? "提現中..." : `提現 NT$${userData.availableCommission}`}
          </button>
        )}
        {userData.availableCommission < 500 && (
          <p className="mt-4 text-center text-sm text-taupe-500">
            滿 NT$500 即可提現 (還需 NT${500 - userData.availableCommission})
          </p>
        )}
      </div>

      {/* 分潤明細 */}
      {commissionHistoryError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          分潤明細載入失敗：{commissionHistoryError}
        </div>
      )}
      {commissionRecords.length > 0 && (
        <div className="rounded-lg border border-taupe-200 bg-white p-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="font-serif text-lg font-normal text-ink">
              分潤明細
            </h3>
            <ChevronDown
              className={`h-5 w-5 text-taupe-600 transition ${
                showHistory ? "rotate-180" : ""
              }`}
            />
          </button>

          {showHistory && (
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {commissionRecords.map((record) => (
                <div
                  key={record.orderId}
                  className="flex items-center justify-between rounded-lg border border-taupe-100 bg-taupe-50 p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">
                      {record.itemsDetail}
                    </p>
                    <p className="text-xs text-taupe-500 mt-1">
                      {new Date(record.date).toLocaleDateString("zh-TW")} · 結帳
                      NT$
                      {record.totalPrice}
                    </p>
                    {record.note && (
                      <p className="text-xs text-amber-600 mt-1">{record.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      +NT${record.commission}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        record.credited ? "text-emerald-600" : "text-taupe-400"
                      }`}
                    >
                      {record.credited ? "已入帳" : "訂單完成後入帳"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 提現紀錄 */}
      {withdrawalHistoryError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          提現紀錄載入失敗：{withdrawalHistoryError}
        </div>
      )}
      {withdrawalRecords.length > 0 && (
        <div className="rounded-lg border border-taupe-200 bg-white p-6">
          <button
            onClick={() => setShowWithdrawalHistory(!showWithdrawalHistory)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="font-serif text-lg font-normal text-ink">
              提現紀錄
            </h3>
            <ChevronDown
              className={`h-5 w-5 text-taupe-600 transition ${
                showWithdrawalHistory ? "rotate-180" : ""
              }`}
            />
          </button>

          {showWithdrawalHistory && (
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {withdrawalRecords.map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-taupe-100 bg-taupe-50 p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">
                      申請日期：{record.requestDate}
                    </p>
                    {record.note && (
                      <p className="text-xs text-red-600 mt-1">{record.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink">
                      NT${record.payoutAmount}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        record.status === "已完成"
                          ? "text-emerald-600"
                          : record.status === "異常"
                          ? "text-red-600"
                          : "text-sapphire-600"
                      }`}
                    >
                      {record.status === "已完成"
                        ? "已提現"
                        : record.status === "異常"
                        ? "異常"
                        : "處理中"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
