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
  Wallet,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { Product } from "@/lib/types";
import { useAuth } from "./CartContext";
import AdminProductEditModal from "./AdminProductEditModal";

type OrderItem = {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentLast5: string;
  itemsDetail: string;
  totalPrice: number;
  totalWeightKg: number;
  status: string;
  paymentStatus: string;
  storeNumber: string;
  faceToFace: string;
  shippingDate: string;
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

type WithdrawalItem = {
  id: string;
  email: string;
  requestDate: string;
  amount: number;
  fee: number;
  payoutAmount: number;
  bankCode: string;
  bankAccount: string;
  status: string;
  note: string;
  resolvedDate: string;
};

export default function AdminDashboard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<"orders" | "statistics" | "products" | "withdrawals">("statistics");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [products, setProducts] = useState<ProductStats[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (open && isAdmin) {
      fetchData();
    }
  }, [open, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [ordersRes, statsRes, productsRes, withdrawalsRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/statistics"),
        fetch("/api/products"),
        fetch("/api/admin/withdrawals"),
      ]);

      if (!ordersRes.ok) throw new Error("獲取訂單失敗");
      if (!statsRes.ok) throw new Error("獲取統計失敗");
      if (!productsRes.ok) throw new Error("獲取商品失敗");

      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      const productsData = await productsRes.json();
      const withdrawalsData = withdrawalsRes.ok ? await withdrawalsRes.json() : null;

      if (ordersData.orders) setOrders(ordersData.orders);
      if (statsData.summary) setStatistics(statsData.summary);
      if (statsData.products) setProducts(statsData.products);
      if (productsData.products) setAllProducts(productsData.products);
      if (withdrawalsData?.withdrawals) setWithdrawals(withdrawalsData.withdrawals);
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
            className="absolute inset-0 bg-taupe-900/50 backdrop-blur-sm"
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
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-taupe-400 transition hover:bg-taupe-100 hover:text-taupe-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6">
              <h2 className="font-serif text-2xl font-normal text-ink">
                管理員面板
              </h2>
              <p className="mt-1 text-sm text-taupe-500">
                查看訂單和銷售統計
              </p>
            </div>

            <div className="mb-6 flex gap-2 border-b border-taupe-200 overflow-x-auto">
              <button
                onClick={() => setTab("statistics")}
                className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                  tab === "statistics"
                    ? "border-b-2 border-sapphire-600 text-sapphire-600"
                    : "text-taupe-600 hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  銷售統計
                </span>
              </button>
              <button
                onClick={() => setTab("products")}
                className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                  tab === "products"
                    ? "border-b-2 border-sapphire-600 text-sapphire-600"
                    : "text-taupe-600 hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  商品管理 ({allProducts.length})
                </span>
              </button>
              <button
                onClick={() => setTab("orders")}
                className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                  tab === "orders"
                    ? "border-b-2 border-sapphire-600 text-sapphire-600"
                    : "text-taupe-600 hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  訂單管理 ({orders.length})
                </span>
              </button>
              <button
                onClick={() => setTab("withdrawals")}
                className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                  tab === "withdrawals"
                    ? "border-b-2 border-sapphire-600 text-sapphire-600"
                    : "text-taupe-600 hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  提現管理 ({withdrawals.filter((w) => w.status === "處理中").length})
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
                <Loader2 className="h-8 w-8 animate-spin text-taupe-400" />
              </div>
            ) : tab === "statistics" ? (
              <StatisticsTab statistics={statistics} products={products} />
            ) : tab === "products" ? (
              <ProductsTab
                products={allProducts}
                onEdit={(product) => {
                  setEditingProduct(product);
                  setShowEditModal(true);
                }}
              />
            ) : tab === "orders" ? (
              <OrdersTab orders={orders} />
            ) : (
              <WithdrawalsTab withdrawals={withdrawals} onUpdated={fetchData} />
            )}

            <button
              onClick={fetchData}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-taupe-100 py-2.5 text-sm font-medium text-ink transition hover:bg-taupe-200 disabled:opacity-50"
            >
              {loading ? "刷新中..." : "刷新數據"}
            </button>
          </motion.div>

          <AdminProductEditModal
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              fetchData();
            }}
            product={editingProduct}
          />
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs font-medium text-blue-600 uppercase">商品總數</p>
          <p className="mt-2 text-2xl font-bold text-blue-900">
            {statistics?.totalProductCount || 0}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-600 uppercase">銷售總數</p>
          <p className="mt-2 text-2xl font-bold text-emerald-900">
            {statistics?.totalUnitsSold || 0}
          </p>
        </div>
        <div className="rounded-xl bg-purple-50 p-4">
          <p className="text-xs font-medium text-purple-600 uppercase">銷售額</p>
          <p className="mt-2 text-2xl font-bold text-purple-900">
            NT${(statistics?.totalRevenue || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <p className="text-sm font-semibold text-ink">商品排行</p>
        {products.map((product) => (
          <div key={product.id} className="rounded-lg bg-taupe-50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{product.name}</p>
                <p className="text-xs text-taupe-500">{product.category}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-ink">{product.totalSold}</p>
                <p className="text-xs text-taupe-500">NT${product.price}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersTab({ orders }: { orders: OrderItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.includes(searchTerm) ||
      order.customerName.includes(searchTerm) ||
      order.customerPhone.includes(searchTerm) ||
      order.customerEmail.includes(searchTerm);
    const matchesStatus = statusFilter === "全部" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateOrder = async (
    orderId: string,
    status: string,
    paymentStatus: string,
    faceToFace: string
  ) => {
    setSaveError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus, faceToFace }),
      });
      if (res.ok) {
        setEditingOrderId(null);
        window.location.reload();
      } else {
        const data = await res.json().catch(() => null);
        setSaveError(data?.error ?? "更新失敗，請稍後再試");
      }
    } catch (error) {
      console.error("更新訂單失敗:", error);
      setSaveError("網路連線異常，請再試一次");
    }
  };

  // 標記已出貨：登錄當日日期到「出貨日期」，並自動將訂單狀態改為「已出貨」
  const handleMarkShipped = async (orderId: string) => {
    setSaveError("");
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "已出貨", shippingDate: today }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => null);
        setSaveError(data?.error ?? "更新失敗，請稍後再試");
      }
    } catch (error) {
      console.error("標記已出貨失敗:", error);
      setSaveError("網路連線異常，請再試一次");
    }
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: 訂單明細（每筆訂單一列）
    const orderData = orders.map((order) => ({
      "訂單編號": order.orderId,
      "客戶名稱": order.customerName,
      "客戶電話": order.customerPhone,
      "客戶Email": order.customerEmail || "",
      "商品明細": order.itemsDetail,
      "訂單總金額": order.totalPrice,
      "總重量(kg)": order.totalWeightKg,
      "7-11 取貨店號": order.storeNumber || "",
      "面交": order.faceToFace || "",
      "匯款末五碼": order.paymentLast5 || "未提供",
      "訂單狀態": order.status,
      "付款狀態": order.paymentStatus,
      "訂單時間": new Date(order.createdTime).toLocaleString(),
    }));

    const orderSheet = XLSX.utils.json_to_sheet(orderData);
    XLSX.utils.book_append_sheet(workbook, orderSheet, "訂單明細");

    // Sheet 2: 商品銷售統計（從商品明細文字解析品名與數量）
    const productSales: { [key: string]: number } = {};

    orders.forEach((order) => {
      parseItemSummaries(order.itemsDetail).forEach(({ name, quantity }) => {
        productSales[name] = (productSales[name] || 0) + quantity;
      });
    });

    const productData = Object.entries(productSales)
      .map(([name, quantity]) => ({
        "商品名稱": name,
        "總銷售數量": quantity,
      }))
      .sort((a, b) => b["總銷售數量"] - a["總銷售數量"]);

    const productSheet = XLSX.utils.json_to_sheet(productData);
    XLSX.utils.book_append_sheet(workbook, productSheet, "商品銷售統計");

    // 設定列寬
    orderSheet["!cols"] = [
      { wch: 16 },
      { wch: 10 },
      { wch: 12 },
      { wch: 24 },
      { wch: 30 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 18 },
    ];
    productSheet["!cols"] = [{ wch: 15 }, { wch: 10 }];

    XLSX.writeFile(workbook, `訂單報表_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // 從商品明細文字（例："小黑瓶 x2（200g）, 白繃帶 x1（50g）\n運費: ..."）解析出品名與數量
  const parseItemSummaries = (
    itemsDetail: string
  ): { name: string; quantity: number }[] => {
    const firstLine = itemsDetail.split("\n")[0] ?? "";
    return firstLine
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        const match = segment.match(/^(.+?)\s*x(\d+)/);
        if (!match) return null;
        return { name: match[1].trim(), quantity: Number(match[2]) };
      })
      .filter((item): item is { name: string; quantity: number } => item !== null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 flex flex-col">
        <button
          onClick={exportToExcel}
          disabled={orders.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:bg-taupe-300 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          匯出Excel報表
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-taupe-200 px-4 py-2 bg-white">
          <Search className="h-4 w-4 text-taupe-400" />
          <input
            type="text"
            placeholder="搜尋訂單ID、客戶名稱、電話或Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm outline-none text-ink placeholder:text-taupe-400"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {["全部", "新訂單", "已出貨", "已完成", "異常中", "已取消"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                statusFilter === status
                  ? "bg-taupe-900 text-white"
                  : "bg-taupe-100 text-taupe-700 hover:bg-taupe-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <p className="text-center text-sm text-taupe-500 py-8">
            {orders.length === 0 ? "暫無訂單" : "未找到匹配的訂單"}
          </p>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl bg-taupe-50 p-4 cursor-pointer transition hover:bg-taupe-100"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{order.orderId}</p>
                  <p className="text-xs text-taupe-500 mt-1">
                    {order.customerName} ({order.customerPhone})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink">
                    NT${order.totalPrice.toLocaleString()}
                  </p>
                  <div className="mt-1 flex gap-1 justify-end">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {order.status}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {expandedId === order.id && (
                <div
                  className="mt-4 border-t border-taupe-200 pt-4 space-y-2 text-xs text-taupe-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p><span className="font-medium text-ink">Email:</span> {order.customerEmail || "未提供"}</p>
                  <p><span className="font-medium text-ink">商品:</span> {order.itemsDetail}</p>
                  <p><span className="font-medium text-ink">重量:</span> {order.totalWeightKg} kg</p>
                  <p><span className="font-medium text-ink">匯款末五碼:</span> {order.paymentLast5 || "未提供"}</p>
                  {order.storeNumber && (
                    <p><span className="font-medium text-ink">7-11 店號:</span> {order.storeNumber}</p>
                  )}
                  <p><span className="font-medium text-ink">面交:</span> {order.faceToFace || "未提供"}</p>
                  <p><span className="font-medium text-ink">出貨日期:</span> {order.shippingDate || "尚未出貨"}</p>
                  <p><span className="font-medium text-ink">時間:</span> {new Date(order.createdTime).toLocaleString()}</p>

                  {order.status !== "已出貨" && order.status !== "已完成" && (
                    <button
                      onClick={() => handleMarkShipped(order.id)}
                      className="mt-1 w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      標記已出貨（登錄今日出貨日期）
                    </button>
                  )}

                  {editingOrderId === order.id ? (
                    <div className="mt-3 space-y-2">
                      {saveError && (
                        <p className="text-red-600 bg-red-50 rounded px-2 py-1.5">{saveError}</p>
                      )}
                      <select
                        defaultValue={order.status}
                        id={`status-${order.id}`}
                        className="w-full px-2 py-1.5 text-xs rounded border border-taupe-200"
                      >
                        <option value="新訂單">新訂單</option>
                        <option value="已出貨">已出貨</option>
                        <option value="已完成">已完成</option>
                        <option value="異常中">異常中</option>
                        <option value="已取消">已取消</option>
                      </select>
                      <select
                        defaultValue={order.paymentStatus}
                        id={`payment-${order.id}`}
                        className="w-full px-2 py-1.5 text-xs rounded border border-taupe-200"
                      >
                        <option value="待核帳">待核帳</option>
                        <option value="已核帳">已核帳</option>
                        <option value="已退款">已退款</option>
                      </select>
                      <textarea
                        defaultValue={order.faceToFace}
                        id={`facetoface-${order.id}`}
                        placeholder="面交細節（例：時間、地點）"
                        rows={2}
                        className="w-full px-2 py-1.5 text-xs rounded border border-taupe-200"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const statusSel = document.getElementById(
                              `status-${order.id}`
                            ) as HTMLSelectElement;
                            const paymentSel = document.getElementById(
                              `payment-${order.id}`
                            ) as HTMLSelectElement;
                            const faceToFaceInput = document.getElementById(
                              `facetoface-${order.id}`
                            ) as HTMLTextAreaElement;
                            handleUpdateOrder(
                              order.id,
                              statusSel.value,
                              paymentSel.value,
                              faceToFaceInput.value
                            );
                          }}
                          className="flex-1 px-2 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingOrderId(null)}
                          className="flex-1 px-2 py-1.5 bg-taupe-200 text-taupe-700 rounded text-xs font-medium hover:bg-taupe-300"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSaveError("");
                        setEditingOrderId(order.id);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      <Edit2 className="h-3 w-3" />
                      編輯狀態
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function WithdrawalsTab({
  withdrawals,
  onUpdated,
}: {
  withdrawals: WithdrawalItem[];
  onUpdated: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState("處理中");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [noteDraftId, setNoteDraftId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [actionError, setActionError] = useState("");

  const filteredWithdrawals = withdrawals.filter(
    (w) => statusFilter === "全部" || w.status === statusFilter
  );

  const handleUpdate = async (id: string, status: "已完成" | "異常", note?: string) => {
    setActionError("");
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        setNoteDraftId(null);
        setNoteDraft("");
        onUpdated();
      } else {
        const data = await res.json().catch(() => null);
        setActionError(data?.error ?? "更新失敗，請稍後再試");
      }
    } catch (error) {
      console.error("更新提現紀錄失敗:", error);
      setActionError("網路連線異常，請再試一次");
    } finally {
      setProcessingId(null);
    }
  };

  const statusColor: Record<string, string> = {
    處理中: "bg-yellow-100 text-yellow-800",
    已完成: "bg-emerald-100 text-emerald-800",
    異常: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["全部", "處理中", "已完成", "異常"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              statusFilter === status
                ? "bg-taupe-900 text-white"
                : "bg-taupe-100 text-taupe-700 hover:bg-taupe-200"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{actionError}</p>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredWithdrawals.length === 0 ? (
          <p className="text-center text-sm text-taupe-500 py-8">
            {withdrawals.length === 0 ? "暫無提現申請" : "沒有符合篩選條件的提現申請"}
          </p>
        ) : (
          filteredWithdrawals.map((w) => (
            <div key={w.id} className="rounded-xl bg-taupe-50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{w.email}</p>
                  <p className="text-xs text-taupe-500 mt-1">申請日期：{w.requestDate}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[w.status] || "bg-taupe-200 text-taupe-700"}`}>
                  {w.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-taupe-600">
                <p>提現金額：NT${w.amount}</p>
                <p>手續費：NT${w.fee}</p>
                <p>實際撥款：NT${w.payoutAmount}</p>
                <p>銀行：{w.bankCode} - {w.bankAccount}</p>
              </div>

              {w.status !== "處理中" && (
                <p className="mt-2 text-xs text-taupe-500">處理日期：{w.resolvedDate || "-"}</p>
              )}
              {w.note && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">{w.note}</p>
              )}

              {w.status === "處理中" && (
                <div className="mt-3 space-y-2">
                  {noteDraftId === w.id ? (
                    <>
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="異常原因（例：帳號有誤，已發信至您的 Email 聯繫）"
                        rows={2}
                        className="w-full px-2 py-1.5 text-xs rounded border border-taupe-200"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(w.id, "異常", noteDraft)}
                          disabled={processingId === w.id}
                          className="flex-1 px-2 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          {processingId === w.id ? "處理中..." : "確認標記異常"}
                        </button>
                        <button
                          onClick={() => {
                            setNoteDraftId(null);
                            setNoteDraft("");
                          }}
                          className="flex-1 px-2 py-1.5 bg-taupe-200 text-taupe-700 rounded text-xs font-medium hover:bg-taupe-300"
                        >
                          取消
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(w.id, "已完成")}
                        disabled={processingId === w.id}
                        className="flex-1 px-2 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {processingId === w.id ? "處理中..." : "標記已完成"}
                      </button>
                      <button
                        onClick={() => {
                          setNoteDraftId(w.id);
                          setNoteDraft("帳號有誤，已發信至您的 Email 聯繫，請確認後回覆");
                        }}
                        disabled={processingId === w.id}
                        className="flex-1 px-2 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 disabled:opacity-50"
                      >
                        標記異常
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type ProductWithVariants = Product & {
  variantCount?: number;
};

function ProductsTab({
  products,
  onEdit,
}: {
  products: Product[];
  onEdit: (product: Product) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [productsWithVariants, setProductsWithVariants] = useState<ProductWithVariants[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(true);

  useEffect(() => {
    const loadVariantCounts = async () => {
      setLoadingVariants(true);
      const updated = await Promise.all(
        products.map(async (product) => {
          try {
            const res = await fetch(`/api/products/${product.id}/variants`);
            if (res.ok) {
              const data = await res.json();
              return {
                ...product,
                variantCount: data.variants?.length || 0,
              };
            }
          } catch (err) {
            console.error("載入變體失敗:", err);
          }
          return { ...product, variantCount: 0 };
        })
      );
      setProductsWithVariants(updated);
      setLoadingVariants(false);
    };

    if (products.length > 0) {
      loadVariantCounts();
    }
  }, [products]);

  const filteredProducts = productsWithVariants.filter((product) => {
    const matchesSearch =
      product.name.includes(searchTerm) ||
      product.brand.includes(searchTerm) ||
      product.category.includes(searchTerm);
    const matchesCategory = categoryFilter === "全部" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["全部", ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <div className="space-y-4">
      <div className="space-y-3 flex flex-col">
        <div className="flex items-center gap-2 rounded-xl border border-taupe-200 px-4 py-2 bg-white">
          <Search className="h-4 w-4 text-taupe-400" />
          <input
            type="text"
            placeholder="搜尋商品名稱、品牌或分類..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm outline-none text-ink placeholder:text-taupe-400"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                categoryFilter === category
                  ? "bg-taupe-900 text-white"
                  : "bg-taupe-100 text-taupe-700 hover:bg-taupe-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <p className="text-center text-sm text-taupe-500 py-8">
            {products.length === 0 ? "暫無商品" : "未找到匹配的商品"}
          </p>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-xl bg-taupe-50 p-4 hover:bg-taupe-100 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{product.name}</p>
                  {product.brand && (
                    <p className="text-xs text-taupe-500">{product.brand}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                      {product.category}
                    </span>
                    <span className="text-xs text-taupe-600">
                      NT${product.price}
                    </span>
                    {product.totalSold > 0 && (
                      <span className="text-xs text-emerald-700 font-medium">
                        已售 {product.totalSold} 件
                      </span>
                    )}
                    {!loadingVariants && product.variantCount && product.variantCount > 0 && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">
                        {product.variantCount} 個選項
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onEdit(product)}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 whitespace-nowrap"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  編輯
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
