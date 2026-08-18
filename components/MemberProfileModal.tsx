"use client";

import { useState } from "react";
import { X } from "lucide-react";

type MemberProfileModalProps = {
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    birthday: string;
    address: string;
    store711Code?: string;
  }) => Promise<void>;
};

export default function MemberProfileModal({
  email,
  isOpen,
  onClose,
  onSubmit,
}: MemberProfileModalProps) {
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");
  const [store711Code, setStore711Code] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!birthday) {
      setError("請填寫生日");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ birthday, address, store711Code });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-medium text-ink">完成會員檔案</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-taupe-400 transition hover:text-taupe-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-taupe-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-lg border border-taupe-200 bg-taupe-50 px-3 py-2 text-sm text-taupe-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-taupe-700 mb-1">
              生日 <span className="text-rose-600">*</span>
            </label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-taupe-200 px-3 py-2 text-sm focus:border-sapphire-500 focus:ring-1 focus:ring-sapphire-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-taupe-700 mb-1">
              預設 7-11 超商取貨店號（結帳時可修改）
            </label>
            <input
              type="text"
              value={store711Code}
              onChange={(e) => setStore711Code(e.target.value)}
              disabled={loading}
              placeholder="如 110817"
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

          <div>
            <label className="block text-sm font-medium text-taupe-700 mb-1">
              預設收件地址（結帳時可修改）
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              placeholder="請輸入完整地址"
              rows={2}
              className="w-full rounded-lg border border-taupe-200 px-3 py-2 text-sm focus:border-sapphire-500 focus:ring-1 focus:ring-sapphire-500"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 p-2 text-xs text-rose-600">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-taupe-200 py-2 text-sm font-medium text-taupe-700 transition hover:bg-taupe-50 disabled:opacity-50"
            >
              稍後再填
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-sapphire-600 py-2 text-sm font-medium text-white transition hover:bg-sapphire-700 disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存資料"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
