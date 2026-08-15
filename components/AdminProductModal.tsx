"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { useAuth } from "./CartContext";
import { cn } from "@/lib/utils";

export default function AdminProductModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    category: "護膚",
    price: "",
    weight_g: "",
    cost50: "",
    cost100: "",
    image: "",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setError("");
      setSuccess(false);
      setFormData({
        name: "",
        category: "護膚",
        price: "",
        weight_g: "",
        cost50: "",
        cost100: "",
        image: "",
        description: "",
      });
    }
  }, [open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      setError("請先登入");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: formData.name.trim(),
          category: formData.category.trim(),
          price: formData.price.trim(),
          weight_g: formData.weight_g.trim() || "0",
          cost50: formData.cost50.trim() || "0",
          cost100: formData.cost100.trim() || "0",
          image: formData.image.trim(),
          description: formData.description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "上架失敗");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError("網路連線異常，請再試一次");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉視窗"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6 text-center">
              <h2 className="font-serif text-2xl font-semibold text-stone-900">
                上架新商品
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                限管理員操作
              </p>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <p className="text-sm font-medium text-stone-800">
                  商品已成功上架！
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    商品名稱 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="例如: 小黑瓶精華液"
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    分類 *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-600/20"
                  >
                    <option value="護膚">護膚</option>
                    <option value="彩妝">彩妝</option>
                    <option value="香水">香水</option>
                    <option value="身體">身體</option>
                    <option value="其他">其他</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                      售價 (NT$) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      step="1"
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-600/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                      單瓶重量 (g)
                    </label>
                    <input
                      type="number"
                      name="weight_g"
                      value={formData.weight_g}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      step="1"
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-600/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                      50瓶成本 (NT$)
                    </label>
                    <input
                      type="number"
                      name="cost50"
                      value={formData.cost50}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-600/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                      100瓶成本 (NT$)
                    </label>
                    <input
                      type="number"
                      name="cost100"
                      value={formData.cost100}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-600/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    商品圖片 URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    商品描述
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="商品特色、使用方式等..."
                    rows={3}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-600/20 resize-none"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "w-full rounded-xl py-3.5 text-sm font-medium text-white transition",
                    submitting
                      ? "cursor-not-allowed bg-stone-400"
                      : "bg-stone-900 hover:bg-stone-800"
                  )}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      上架中...
                    </span>
                  ) : (
                    "確認上架"
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
