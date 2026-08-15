"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  TrendingUp,
  Package,
  Loader2,
  AlertTriangle,
  Download,
  Search,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "./CartContext";

type OrderItem = {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  paymentLast5: string;
  itemsDetail: string;
  totalPrice: number;
  totalWeightKg: number;
  status: string;
  paymentStatus: string;
  createdTime: string;
};

type ProductStats = {
  id: string;
  name: string;
  category: string;
  price: number;
  totalSold: number;
};

type Statistics = {
  totalProductCount: number;
  totalUnitsSold: number;
  totalRevenue: number;
};

export default function AdminDashboard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<"orders" | "statistics">("statistics");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [products, setProducts] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && isAdmin) {
      fetchData();
    }
  }, [open, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      // 並行獲取訂單和統計
      const [ordersRes, statsRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/statistics"),
      ]);

      if (!ordersRes.ok) throw new Error("獲取訂單失敗");
      if (!statsRes.ok) throw new Error("獲取統計失敗");

      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();

      if (ordersData.orders) setOrders(ordersData.orders);
      if (statsData.summary) setStatistics(statsData.summary);
      if (statsData.products) setProducts(statsData.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入數據失敗");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

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
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉視窗"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6">
              <h2 className="font-serif text-2xl font-semibold text-stone-900">
                管理員面板
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                查看訂單和銷售統計
              </p>
            </div>

            {/* 標籤切換 */}
            <div className="mb-6 flex gap-2 border-b border-stone-200">
              <button
                onClick={() => setTab("statistics")}
                className={`px-4 py-3 text-sm font-medium transition ${
                  tab === "statistics"
                    ? "border-b-2 border-pink-600 text-pink-600"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  銷售統計
                </span>
              </button>
              <button
                onClick={() => setTab("orders")}
                className={`px-4 py-3 text-sm font-medium transition ${
                  tab === "orders"
                    ? "border-b-2 border-pink-600 text-pink-600"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  訂單管理 ({orders.length})
                </span>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
              </div>
            ) : tab === "statistics" ? (
              <StatisticsTab statistics={statistics} products={products} />
            ) : (
              <OrdersTab orders={orders} />
            )}

            <button
              onClick={fetchData}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-stone-100 py-2.5 text-sm font-medium text-stone-900 transition hover:bg-stone-200 disabled:opacity-50"
            >
              {loading ? "刷新中..." : "刷新數據"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function StatisticsTab({
  statistics,
  products,
}: {
  statistics: Statistics | null;
  products: ProductStats[];
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDateFilter = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/statistics?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("篩選統計失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 日期範圍篩選 */}
      <div className="rounded-xl bg-blue-50 p-4 space-y-3">
        <p className="text-xs font-medium text-blue-900 uppercase tracking-wide">
          日期範圍篩選
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <button
            onClick={handleDateFilter}
            disabled={!startDate || !endDate || loading}
            className="col-span-2 sm:col-span-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "篩選中..." : "篩選"}
          </button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">
                商品總數
              </p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">
                {statistics?.totalProductCount || 0}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600/40" />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">
                銷售總數
              </p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">
                {statistics?.totalUnitsSold || 0}
              </p>
            </div>
            <ShoppingBag className="h-8 w-8 text-emerald-600/40" />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">
                總銷售額
              </p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">
                NT${(statistics?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-600/40" />
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-stone-900">
          商品銷售排行
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {products.length === 0 ? (
            <p className="text-center text-sm text-stone-500 py-8">
              暫無商品
            </p>
          ) : (
            products.map((product, index) => {
              const maxSold = Math.max(...products.map((p) => p.totalSold));
              const progressPercent =
                maxSold > 0 ? (product.totalSold / maxSold) * 100 : 0;

              return (
                <div
                  key={product.id}
                  className="rounded-xl bg-stone-50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        {index + 1}. {product.name}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {product.category} • NT${product.price}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-900">
                        {product.totalSold} 件
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        NT$
                        {(
                          product.price * product.totalSold
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-pink-600 h-full rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ orders }: { orders: OrderItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "新訂單":
        return "bg-blue-100 text-blue-800";
      case "已出貨":
        return "bg-emerald-100 text-emerald-800";
      case "已取消":
        return "bg-red-100 text-red-800";
      default:
        return "bg-stone-100 text-stone-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "待核帳":
        return "bg-yellow-100 text-yellow-800";
      case "已核帳":
        return "bg-emerald-100 text-emerald-800";
      case "已退款":
        return "bg-red-100 text-red-800";
      default:
        return "bg-stone-100 text-stone-800";
    }
  };

  const handleUpdateOrder = async (
    orderId: string,
    status: string,
    paymentStatus: string
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus }),
      });

      if (res.ok) {
        setEditingOrderId(null);
        // 重新載入數據
        window.location.reload();
      }
    } catch (error) {
      console.error("更新訂單失敗:", error);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ["訂單ID", "客戶", "電話", "商品", "金額", "重量", "狀態", "付款狀態"];
    const rows = filteredOrders.map((order) => [
      order.orderId,
      order.customerName,
      order.customerPhone,
      order.itemsDetail,
      order.totalPrice,
      order.totalWeightKg,
      order.status,
      order.paymentStatus,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell);
            if (str.includes(",") || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `訂單匯出_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.includes(searchTerm) ||
      order.customerName.includes(searchTerm) ||
      order.customerPhone.includes(searchTerm);

    const matchesStatus =
      statusFilter === "全部" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* 搜尋和過濾欄 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 bg-white">
          <Search className="h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="搜尋訂單ID、客戶名稱或電話..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm outline-none text-stone-900 placeholder:text-stone-400"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {["全部", "新訂單", "已出貨", "已取消"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                statusFilter === status
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
        >
          <Download className="h-3.5 w-3.5" />
          匯出 CSV
        </button>
      </div>

      {/* 訂單列表 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <p className="text-center text-sm text-stone-500 py-8">
            {orders.length === 0 ? "暫無訂單" : "未找到匹配的訂單"}
          </p>
        ) : (
          filteredOrders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl bg-stone-50 p-4 transition hover:bg-stone-100"
          >
            {editingOrderId === order.id ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-stone-900">
                  {order.orderId}
                </p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-stone-600 block mb-1">
                      訂單狀態
                    </label>
                    <select
                      id={`status-${order.id}`}
                      defaultValue={order.status}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/20"
                    >
                      <option value="新訂單">新訂單</option>
                      <option value="已出貨">已出貨</option>
                      <option value="已取消">已取消</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-600 block mb-1">
                      付款狀態
                    </label>
                    <select
                      id={`payment-${order.id}`}
                      defaultValue={order.paymentStatus}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/20"
                    >
                      <option value="待核帳">待核帳</option>
                      <option value="已核帳">已核帳</option>
                      <option value="已退款">已退款</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      const statusSelect = document.getElementById(
                        `status-${order.id}`
                      ) as HTMLSelectElement;
                      const paymentSelect = document.getElementById(
                        `payment-${order.id}`
                      ) as HTMLSelectElement;
                      handleUpdateOrder(
                        order.id,
                        statusSelect.value,
                        paymentSelect.value
                      );
                    }}
                    disabled={updatingOrderId === order.id}
                    className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    保存
                  </button>
                  <button
                    onClick={() => setEditingOrderId(null)}
                    className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 transition"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  onClick={() =>
                    setExpandedId(expandedId === order.id ? null : order.id)
                  }
                  className="cursor-pointer flex items-start justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {order.orderId}
                    </p>
                    <p className="text-xs text-stone-500 mt-2">
                      客戶: {order.customerName} ({order.customerPhone})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-stone-900">
                      NT${order.totalPrice.toLocaleString()}
                    </p>
                    <div className="mt-2 flex gap-1 justify-end flex-wrap">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedId === order.id && (
                  <div className="mt-4 border-t border-stone-200 pt-4 text-xs text-stone-600 space-y-2">
                    <p>
                      <span className="font-medium text-stone-900">商品:</span>{" "}
                      {order.itemsDetail}
                    </p>
                    <p>
                      <span className="font-medium text-stone-900">重量:</span>{" "}
                      {order.totalWeightKg} kg
                    </p>
                    <p>
                      <span className="font-medium text-stone-900">
                        匯款末五碼:
                      </span>{" "}
                      {order.paymentLast5 || "未提供"}
                    </p>
                    <p>
                      <span className="font-medium text-stone-900">時間:</span>{" "}
                      {new Date(order.createdTime).toLocaleString()}
                    </p>
                    <button
                      onClick={() => setEditingOrderId(order.id)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    >
                      <Edit2 className="h-3 w-3" />
                      編輯狀態
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
