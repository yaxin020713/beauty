"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/components/CartContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

type OrderItem = {
  id: string;
  orderId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  itemsDetail: string;
  totalPrice: number;
  orderStatus: string;
  shippingMethod: "convenience_711" | "face_to_face";
  store7_11: string;
  paymentLast5?: number;
};

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState<{ [key: string]: string }>({});
  const [submittingPayment, setSubmittingPayment] = useState<{ [key: string]: boolean }>({});
  const [paymentForm, setPaymentForm] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isLoading && user?.email) {
      loadOrders();
    }
  }, [isLoading, user?.email]);

  const loadOrders = async () => {
    if (!user?.email) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/orders/my-orders?email=${encodeURIComponent(user.email)}`
      );

      if (!response.ok) {
        throw new Error("查詢訂單失敗");
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("加載訂單失敗:", err);
      setError("無法加載訂單，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (orderId: string) => {
    const last5 = paymentForm[orderId];

    if (!last5 || last5.replace(/\D/g, "").length === 0) {
      setPaymentError(prev => ({
        ...prev,
        [orderId]: "請填寫匯款末5碼"
      }));
      return;
    }

    setSubmittingPayment(prev => ({ ...prev, [orderId]: true }));
    setPaymentError(prev => ({ ...prev, [orderId]: "" }));

    try {
      const response = await fetch("/api/orders/update-payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: orderId,
          paymentLast5: last5,
        }),
      });

      if (!response.ok) {
        throw new Error("更新失敗");
      }

      // 刷新訂單列表
      await loadOrders();
      setPaymentForm(prev => ({ ...prev, [orderId]: "" }));
    } catch (err) {
      console.error("付款更新失敗:", err);
      setPaymentError(prev => ({
        ...prev,
        [orderId]: "付款資訊更新失敗，請稍後再試"
      }));
    } finally {
      setSubmittingPayment(prev => ({ ...prev, [orderId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sapphire-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <button
              onClick={() => router.back()}
              className="mb-8 flex items-center gap-2 text-sapphire-600 transition hover:text-sapphire-700"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">返回</span>
            </button>
            <div className="flex flex-col items-center gap-4 rounded-lg bg-taupe-50 p-12 text-center">
              <p className="text-lg text-taupe-600">需要登入才能訪問此頁面</p>
              <p className="text-sm text-taupe-500">請在頁面右上角點擊「登入」按鈕</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* 返回按鈕 */}
          <button
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-sapphire-600 transition hover:text-sapphire-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">返回</span>
          </button>

          {/* 頁面標題 */}
          <div className="mb-10">
            <h1 className="font-serif text-3xl font-normal text-ink">
              我的訂單
            </h1>
            <p className="mt-2 text-taupe-600">
              查看你的所有預訂單
            </p>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}

          {/* 載入中 */}
          {loading && (
            <div className="flex flex-col items-center gap-4 rounded-lg bg-taupe-50 p-12">
              <Loader2 className="h-8 w-8 animate-spin text-sapphire-600" />
              <p className="text-taupe-600">載入中...</p>
            </div>
          )}

          {/* 訂單列表 */}
          {!loading && orders.length > 0 && (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-taupe-200 overflow-hidden"
                >
                  {/* 訂單頭部 */}
                  <div className="bg-taupe-50 px-6 py-4 border-b border-taupe-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-taupe-600">訂單編號</p>
                        <p className="font-mono font-semibold text-ink">
                          {order.orderId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-taupe-600">訂單日期</p>
                        <p className="text-sm font-medium text-ink">
                          {new Date(order.date).toLocaleDateString("zh-TW", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-taupe-600">狀態</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          order.orderStatus === "新訂單"
                            ? "bg-blue-100 text-blue-700"
                            : order.orderStatus === "已發貨"
                            ? "bg-emerald-100 text-emerald-700"
                            : order.orderStatus === "已完成"
                            ? "bg-emerald-200 text-emerald-800"
                            : "bg-taupe-100 text-taupe-700"
                        }`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 訂單內容 */}
                  <div className="px-6 py-6 space-y-6">
                    {/* 客戶資訊 */}
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-taupe-600 mb-1">
                          姓名
                        </p>
                        <p className="text-sm font-medium text-ink">
                          {order.customerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-taupe-600 mb-1">
                          電話
                        </p>
                        <p className="text-sm font-medium text-ink">
                          {order.customerPhone}
                        </p>
                      </div>
                    </div>

                    {/* 商品清單 */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-taupe-600 mb-3">
                        商品清單
                      </p>
                      <div className="bg-taupe-50 rounded-lg p-4">
                        <pre className="text-xs font-mono text-taupe-700 whitespace-pre-wrap">
                          {order.itemsDetail.split("【收貨方式】")[0]}
                        </pre>
                      </div>
                    </div>

                    {/* 收貨方式 */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-taupe-600 mb-2">
                        收貨方式
                      </p>
                      <p className="text-sm text-ink">
                        {order.shippingMethod === "convenience_711"
                          ? `7-11 超商取貨 (編號：${order.store7_11})`
                          : "面交"}
                      </p>
                    </div>

                    {/* 金額 */}
                    <div className="border-t border-taupe-200 pt-6 space-y-6">
                      <div className="flex items-center justify-end gap-12">
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-taupe-600 mb-1">
                            預訂總額
                          </p>
                          <p className="text-lg font-semibold text-ink">
                            NT$ {order.totalPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* 付款欄位 */}
                      {order.orderStatus === "新訂單" && !order.paymentLast5 ? (
                        <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                          <div>
                            <p className="text-sm font-semibold text-blue-900 mb-3">
                              💳 請填寫付款資訊
                            </p>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="匯款末5碼"
                              maxLength={5}
                              value={paymentForm[order.id] || ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                                setPaymentForm(prev => ({
                                  ...prev,
                                  [order.id]: val
                                }));
                              }}
                              className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            {paymentError[order.id] && (
                              <p className="text-xs text-red-600 mt-2">
                                {paymentError[order.id]}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handlePaymentSubmit(order.id)}
                            disabled={submittingPayment[order.id]}
                            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                          >
                            {submittingPayment[order.id] ? "更新中..." : "確認已付款"}
                          </button>
                        </div>
                      ) : order.paymentLast5 ? (
                        <div className="bg-emerald-50 rounded-lg p-4">
                          <p className="text-xs uppercase tracking-wider text-emerald-700 mb-1">
                            付款末5碼
                          </p>
                          <p className="text-sm font-mono text-emerald-900">
                            ****{String(order.paymentLast5).padStart(5, "0")}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 空狀態 */}
          {!loading && orders.length === 0 && !error && (
            <div className="flex flex-col items-center gap-4 rounded-lg bg-taupe-50 p-12 text-center">
              <p className="text-lg text-taupe-600">還沒有訂單</p>
              <p className="text-sm text-taupe-500">
                開始瀏覽商品並下單吧！
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 rounded-lg bg-sapphire-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-sapphire-700"
              >
                去逛逛
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
