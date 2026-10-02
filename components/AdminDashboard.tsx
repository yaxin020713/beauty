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
  Wallet,
  Boxes,
  Mail,
  Copy,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { Product } from "@/lib/types";
import { useAuth } from "./CartContext";
import AdminProductEditModal from "./AdminProductEditModal";
import { generateAndUploadFeaturedShareImage } from "@/lib/storyShareImage";

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
  const [tab, setTab] = useState<"orders" | "statistics" | "products" | "withdrawals" | "batches">("statistics");
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
              <button
                onClick={() => setTab("batches")}
                className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                  tab === "batches"
                    ? "border-b-2 border-sapphire-600 text-sapphire-600"
                    : "text-taupe-600 hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Boxes className="h-4 w-4" />
                  批次管理
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
                onToggled={fetchData}
              />
            ) : tab === "orders" ? (
              <OrdersTab orders={orders} onUpdated={fetchData} />
            ) : tab === "withdrawals" ? (
              <WithdrawalsTab withdrawals={withdrawals} onUpdated={fetchData} />
            ) : (
              <BatchesTab />
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

function OrdersTab({ orders, onUpdated }: { orders: OrderItem[]; onUpdated: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const [generatingEmails, setGeneratingEmails] = useState(false);
  const [emailGenerationMessage, setEmailGenerationMessage] = useState("");
  const [copyPromptMessage, setCopyPromptMessage] = useState("");

  // 複製一段提示文字，讓管理員貼到手機版 Claude App，由 Claude 讀取 Notion「待發送郵件」
  // 資料庫中狀態為 pending 的紀錄，逐一寄出並回填為 sent（需先在 Claude 帳號授權 Notion 與 Gmail 連接器）
  const handleCopyDispatchPrompt = async () => {
    const prompt = [
      "請幫我處理待發送的訂單通知信：",
      "1. 在 Notion 找到「待發送郵件」資料庫（欄位包含 Order_ID、Customer_Name、Customer_Email、Email_Subject、Email_Body、Template_Type、Status）。",
      "2. 篩選出 Status 為 pending 的所有紀錄。",
      "3. 對每一筆紀錄，用 Email_Subject 當標題、Email_Body 當內文，寄送到 Customer_Email。",
      "4. 每寄出一封，就把該筆紀錄的 Status 改成 sent。",
      "5. 全部處理完後，回報總共寄了幾封、有沒有寄送失敗的。",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(prompt);
      setCopyPromptMessage("✅ 已複製提示文字，請打開 Claude App 貼上並送出");
    } catch (err) {
      console.error("複製提示文字失敗:", err);
      setCopyPromptMessage("❌ 複製失敗，請手動複製");
    }
  };

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
    status: string
  ) => {
    setSaveError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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


  // 付款通知：抓「新訂單」；出貨通知：抓已發過付款通知、尚未出貨的訂單
  const getEligibleOrdersForEmail = (templateType: "payment" | "shipment") =>
    orders.filter((order) =>
      templateType === "payment" ? order.status === "新訂單" : order.status === "已發付款通知"
    );

  const handleGenerateEmails = async (templateType: "payment" | "shipment") => {
    const pendingOrders = getEligibleOrdersForEmail(templateType);

    if (pendingOrders.length === 0) {
      setEmailGenerationMessage("沒有符合條件的訂單可以生成郵件");
      return;
    }

    setGeneratingEmails(true);
    setEmailGenerationMessage("");

    try {
      const res = await fetch("/api/admin/generate-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: pendingOrders.map((o) => o.orderId),
          templateType,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // 生成成功或先前已生成過（略過）的訂單，代表通知信這一關已經處理過，
        // 更新訂單狀態避免下次生成時被重複挑選到
        const processedOrderIds = new Set(
          (data.results as Array<{ orderId: string; status: string }>)
            .filter((r) => r.status !== "failed")
            .map((r) => r.orderId)
        );
        const ordersToUpdate = pendingOrders.filter((order) =>
          processedOrderIds.has(order.orderId)
        );

        if (ordersToUpdate.length > 0) {
          const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });
          await Promise.all(
            ordersToUpdate.map((order) =>
              fetch(`/api/admin/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                  templateType === "payment"
                    ? { status: "已發付款通知" }
                    : { status: "已出貨", shippingDate: today }
                ),
              }).catch((err) => console.error(`更新訂單 ${order.orderId} 狀態失敗:`, err))
            )
          );
          onUpdated();
        }

        // 有失敗時列出每筆失敗的原因，方便直接判斷是 Notion 欄位還是資料問題
        const failureLines = (data.results as Array<{ orderId: string; status: string; message?: string }>)
          .filter((r) => r.status === "failed")
          .map((r) => `・${r.orderId}：${r.message ?? "未知錯誤"}`);

        setEmailGenerationMessage(
          `${failureLines.length > 0 ? "⚠️" : "✅"} 成功生成 ${data.summary.success} 筆郵件，已略過（先前已生成過）${data.summary.skipped ?? 0} 筆，失敗 ${data.summary.failed} 筆` +
            (failureLines.length > 0 ? `\n${failureLines.join("\n")}` : "")
        );
      } else {
        const error = await res.json().catch(() => null);
        setEmailGenerationMessage(
          `❌ 生成失敗: ${error?.error ?? "未知錯誤"}`
        );
      }
    } catch (error) {
      console.error("生成郵件失敗:", error);
      setEmailGenerationMessage("❌ 網路連線異常，請再試一次");
    } finally {
      setGeneratingEmails(false);
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
      "匯款末五碼": order.paymentLast5 || "未提供",
      "訂單狀態": order.status,
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
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            disabled={orders.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:bg-taupe-300 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            匯出Excel報表
          </button>
          <button
            onClick={() => handleGenerateEmails("payment")}
            disabled={generatingEmails || getEligibleOrdersForEmail("payment").length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:bg-taupe-300 disabled:cursor-not-allowed"
          >
            {generatingEmails ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                生成付款郵件
              </>
            )}
          </button>
          <button
            onClick={() => handleGenerateEmails("shipment")}
            disabled={generatingEmails || getEligibleOrdersForEmail("shipment").length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white transition hover:bg-purple-700 disabled:bg-taupe-300 disabled:cursor-not-allowed"
          >
            {generatingEmails ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                生成出貨郵件
              </>
            )}
          </button>
        </div>
        {emailGenerationMessage && (
          <div
            className={`text-sm p-3 rounded-xl text-center whitespace-pre-line ${
              emailGenerationMessage.startsWith("✅")
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {emailGenerationMessage}
          </div>
        )}
        <button
          onClick={handleCopyDispatchPrompt}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-taupe-800 text-white transition hover:bg-taupe-900"
        >
          <Copy className="h-4 w-4" />
          寄送（複製指令給手機版 Claude 處理）
        </button>
        {copyPromptMessage && (
          <div
            className={`text-sm p-3 rounded-xl text-center ${
              copyPromptMessage.startsWith("✅")
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {copyPromptMessage}
          </div>
        )}
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
          {["全部", "新訂單", "核帳中", "已付款", "已發付款通知", "已出貨", "已完成", "異常中", "已取消"].map((status) => (
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
                  <p><span className="font-medium text-ink">出貨日期:</span> {order.shippingDate || "尚未出貨"}</p>
                  <p><span className="font-medium text-ink">時間:</span> {new Date(order.createdTime).toLocaleString()}</p>

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
                        <option value="核帳中">核帳中</option>
                        <option value="已付款">已付款</option>
                        <option value="已發付款通知">已發付款通知</option>
                        <option value="已出貨">已出貨</option>
                        <option value="已完成">已完成</option>
                        <option value="異常中">異常中</option>
                        <option value="已取消">已取消</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const statusSel = document.getElementById(
                              `status-${order.id}`
                            ) as HTMLSelectElement;
                            handleUpdateOrder(
                              order.id,
                              statusSel.value
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
  onToggled,
}: {
  products: Product[];
  onEdit: (product: Product) => void;
  onToggled: () => void;
}) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [productsWithVariants, setProductsWithVariants] = useState<ProductWithVariants[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleToggleActive = async (product: Product) => {
    if (!user?.email || togglingId) return;
    setTogglingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, isActive: !product.isActive }),
      });
      if (res.ok) {
        onToggled();
      }
    } catch (err) {
      console.error("切換上架狀態失敗:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  // 設為本次檔期主打商品：同時間只能有一個，後端會自動把其他商品的主打標記取消
  const handleToggleFeatured = async (product: Product) => {
    if (!user?.email || togglingFeaturedId) return;
    setTogglingFeaturedId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, isFeatured: !product.isFeatured }),
      });
      if (res.ok) {
        onToggled();
      }
    } catch (err) {
      console.error("切換主打商品失敗:", err);
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  const [generatingShareImage, setGeneratingShareImage] = useState(false);
  const [shareImageMessage, setShareImageMessage] = useState("");

  // 針對目前的「主打商品」產生限動分享圖並上傳，網址存回該商品記錄；
  // 之後所有會員點分享都是直接拿這張現成的圖，不用每人各自在瀏覽器裡重新產生
  const handleGenerateShareImage = async () => {
    const featured = products.find((p) => p.isFeatured);
    if (!featured) {
      setShareImageMessage("❌ 請先設定一個「本次檔期主打」商品");
      return;
    }
    if (!user?.email) return;

    setGeneratingShareImage(true);
    setShareImageMessage("");
    try {
      const { url, productImageFailed } = await generateAndUploadFeaturedShareImage({
        name: featured.name,
        price: featured.price,
        imageUrl: featured.image,
      });

      if (!url) {
        setShareImageMessage("❌ 產生或上傳分享圖失敗，請稍後再試");
        return;
      }

      const res = await fetch(`/api/products/${featured.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, shareImageUrl: url }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setShareImageMessage(
          `❌ 分享圖已產生，但寫入商品記錄失敗：${errData?.error ?? "未知錯誤"}`
        );
        return;
      }

      setShareImageMessage(
        productImageFailed
          ? "⚠️ 分享圖已產生並上傳，但商品圖片嵌入失敗（可能是圖片來源跨網域限制），畫面上商品圖那塊會是空的，建議改用商品編輯中上傳的圖片"
          : "✅ 分享圖已產生並上傳，會員點分享時就會用這張圖"
      );
      onToggled();
    } catch (err) {
      console.error("產生分享圖失敗:", err);
      setShareImageMessage("❌ 產生分享圖失敗，請稍後再試");
    } finally {
      setGeneratingShareImage(false);
    }
  };

  const handleBulkSetActive = async (active: boolean, targets: Product[]) => {
    if (!user?.email || bulkLoading || targets.length === 0) return;
    const label = active ? "上架" : "下架";
    if (!confirm(`確定要將目前顯示的 ${targets.length} 項商品全部設為「${label}」嗎？`)) return;

    setBulkLoading(true);
    try {
      for (const product of targets) {
        if (product.isActive === active) continue;
        try {
          await fetch(`/api/products/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, isActive: active }),
          });
        } catch (err) {
          console.error(`切換商品 ${product.name} 狀態失敗:`, err);
        }
      }
      onToggled();
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    const loadVariantCounts = async () => {
      setLoadingVariants(true);
      // 一次取得所有商品的選項數量；逐一查詢每個商品會對 Notion 發出上百個請求而被限流
      let counts: Record<string, number> = {};
      try {
        const res = await fetch("/api/admin/variant-counts");
        if (res.ok) {
          const data = await res.json();
          counts = data.counts || {};
        }
      } catch (err) {
        console.error("載入選項數量失敗:", err);
      }
      setProductsWithVariants(
        products.map((product) => ({ ...product, variantCount: counts[product.id] || 0 }))
      );
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
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" ? product.isActive : !product.isActive);
    return matchesSearch && matchesCategory && matchesActive;
  });

  const categories = ["全部", ...Array.from(new Set(products.map((p) => p.category)))];

  const activeCount = products.filter((p) => p.isActive).length;
  const activeFilterOptions = [
    { key: "all" as const, label: `全部 (${products.length})` },
    { key: "active" as const, label: `上架中 (${activeCount})` },
    { key: "inactive" as const, label: `已下架 (${products.length - activeCount})` },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-champagne-300 bg-champagne-50 p-4 space-y-2">
        <p className="text-sm font-medium text-ink">IG 限動分享圖</p>
        <p className="text-xs text-taupe-600">
          針對目前標記「⭐ 本次檔期主打」的商品產生一張分享圖並上傳，之後所有會員點「分享到 Instagram」都會直接使用這張圖，不用每人各自重新產生。
        </p>
        <button
          type="button"
          disabled={generatingShareImage}
          onClick={handleGenerateShareImage}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-champagne-600 text-white hover:bg-champagne-700 disabled:opacity-50"
        >
          {generatingShareImage ? "產生中..." : "產生本次檔期分享圖"}
        </button>
        {shareImageMessage && (
          <p className="text-xs text-taupe-700">{shareImageMessage}</p>
        )}
      </div>

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

        {/* 上下架狀態篩選 */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-taupe-100 p-1">
          {activeFilterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setActiveFilter(option.key)}
              className={`rounded-lg py-2 text-xs font-medium transition ${
                activeFilter === option.key
                  ? option.key === "active"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-taupe-900 text-white shadow-sm"
                  : "text-taupe-700 hover:bg-taupe-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-taupe-500">
            以下批次操作僅套用於「目前顯示（搜尋／狀態／分類篩選後）」的 {filteredProducts.length} 項商品
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => handleBulkSetActive(false, filteredProducts)}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-taupe-200 text-taupe-700 hover:bg-taupe-300 disabled:opacity-50 whitespace-nowrap"
            >
              {bulkLoading ? "處理中..." : "全部下架"}
            </button>
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => handleBulkSetActive(true, filteredProducts)}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 whitespace-nowrap"
            >
              {bulkLoading ? "處理中..." : "全部上架"}
            </button>
          </div>
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
            {products.length === 0
              ? "暫無商品"
              : activeFilter === "active"
              ? "目前沒有上架中的商品"
              : activeFilter === "inactive"
              ? "目前沒有已下架的商品"
              : "未找到匹配的商品"}
          </p>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`rounded-xl p-4 transition ${
                product.isActive ? "bg-taupe-50 hover:bg-taupe-100" : "bg-taupe-50/50 opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{product.name}</p>
                  {product.brand && (
                    <p className="text-xs text-taupe-500">{product.brand}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        product.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-taupe-200 text-taupe-600"
                      }`}
                    >
                      {product.isActive ? "上架中" : "已下架"}
                    </span>
                    {product.isFeatured && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-champagne-200 text-champagne-900">
                        ⭐ 本次檔期主打
                      </span>
                    )}
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
                <div className="flex flex-col items-stretch gap-2">
                  <button
                    onClick={() => handleToggleActive(product)}
                    disabled={togglingId === product.id}
                    className={`flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap disabled:opacity-50 ${
                      product.isActive
                        ? "bg-taupe-200 text-taupe-700 hover:bg-taupe-300"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {togglingId === product.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : product.isActive ? (
                      "下架"
                    ) : (
                      "上架"
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(product)}
                    disabled={togglingFeaturedId === product.id}
                    className={`flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap disabled:opacity-50 ${
                      product.isFeatured
                        ? "bg-champagne-200 text-champagne-900 hover:bg-champagne-300"
                        : "bg-taupe-100 text-taupe-700 hover:bg-taupe-200"
                    }`}
                  >
                    {togglingFeaturedId === product.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : product.isFeatured ? (
                      "取消主打"
                    ) : (
                      "設為主打"
                    )}
                  </button>
                  <button
                    onClick={() => onEdit(product)}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 whitespace-nowrap"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    編輯
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BatchesTab() {
  const [batchId, setBatchId] = useState("");
  const [notificationType, setNotificationType] = useState<"payment" | "shipment">("payment");
  const [loading, setLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);
  const [message, setMessage] = useState("");

  const handlePreview = async () => {
    if (!batchId.trim()) {
      setMessage("請輸入批次 ID");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(
        `/api/admin/batches/${batchId}/notifications/export?type=${notificationType}&format=preview`
      );
      if (res.ok) {
        const data = await res.json();
        setPreviewCount(data.total);
        setMessage(`✅ 找到 ${data.total} 筆通知記錄`);
      } else {
        const error = await res.json();
        setMessage(`❌ ${error.error}`);
      }
    } catch (error) {
      setMessage(`❌ 錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!batchId.trim()) {
      setMessage("請輸入批次 ID");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/batches/${batchId}/notifications/export?type=${notificationType}&format=download`
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          res.headers
            .get("content-disposition")
            ?.split("filename=")[1]
            ?.replaceAll('"', "") || "notifications.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage(`✅ 已下載 ${previewCount} 筆通知清單`);
      } else {
        const error = await res.json();
        setMessage(`❌ ${error.error}`);
      }
    } catch (error) {
      setMessage(`❌ 錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-blue-50 p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-taupe-900 mb-2">
            批次 ID
          </label>
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            placeholder="輸入批次 ID（例如：batch-2026-08）"
            className="w-full px-4 py-2 border border-taupe-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sapphire-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-taupe-900 mb-2">
            通知類型
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="payment"
                checked={notificationType === "payment"}
                onChange={(e) => setNotificationType(e.target.value as "payment")}
              />
              <span className="text-sm">付款通知</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="shipment"
                checked={notificationType === "shipment"}
                onChange={(e) => setNotificationType(e.target.value as "shipment")}
              />
              <span className="text-sm">出貨通知</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={loading || !batchId.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sapphire-100 text-sapphire-700 font-medium rounded-lg hover:bg-sapphire-200 disabled:bg-taupe-300 disabled:text-taupe-600 transition text-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            預覽
          </button>
          <button
            onClick={handleExport}
            disabled={loading || !batchId.trim() || previewCount === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-taupe-900 text-white font-medium rounded-lg hover:bg-taupe-800 disabled:bg-taupe-400 transition text-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            導出 CSV
          </button>
        </div>

        {message && (
          <div
            className={`text-sm p-3 rounded-lg ${
              message.startsWith("✅")
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-taupe-50 p-4 text-sm text-taupe-700 space-y-2">
        <p className="font-semibold">📖 使用說明</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>輸入批次 ID 並選擇通知類型</li>
          <li>點「預覽」檢查將發送的郵件數量</li>
          <li>點「導出 CSV」下載完整清單</li>
          <li>在 Excel 中複製郵件內容，貼到郵件客戶端發送</li>
          <li>所有變數已自動帶入，無需修改</li>
        </ul>
      </div>
    </div>
  );
}
