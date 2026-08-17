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
import * as XLSX from "xlsx";
import type { Product } from "@/lib/types";
import { useAuth } from "./CartContext";
import AdminProductEditModal from "./AdminProductEditModal";

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
  storeNumber: string;
  faceToFace: string;
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
  const [tab, setTab] = useState<"orders" | "statistics" | "products">("statistics");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [products, setProducts] = useState<ProductStats[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
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
      const [ordersRes, statsRes, productsRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/statistics"),
        fetch("/api/products"),
      ]);

      if (!ordersRes.ok) throw new Error("獲取訂單失敗");
      if (!statsRes.ok) throw new Error("獲取統計失敗");
      if (!productsRes.ok) throw new Error("獲取商品失敗");

      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      const productsData = await productsRes.json();

      if (ordersData.orders) setOrders(ordersData.orders);
      if (statsData.summary) setStatistics(statsData.summary);
      if (statsData.products) setProducts(statsData.products);
      if (productsData.products) setAllProducts(productsData.products);
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

            <div className="mb-6 flex gap-2 border-b border-stone-200 overflow-x-auto">
              <button
                onClick={() => setTab("statistics")}
                className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
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
                onClick={() => setTab("products")}
                className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                  tab === "products"
                    ? "border-b-2 border-pink-600 text-pink-600"
                    : "text-stone-600 hover:text-stone-900"
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
            ) : tab === "products" ? (
              <ProductsTab
                products={allProducts}
                onEdit={(product) => {
                  setEditingProduct(product);
                  setShowEditModal(true);
                }}
              />
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
        <p className="text-sm font-semibold text-stone-900">商品排行</p>
        {products.map((product) => (
          <div key={product.id} className="rounded-lg bg-stone-50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-900">{product.name}</p>
                <p className="text-xs text-stone-500">{product.category}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-stone-900">{product.totalSold}</p>
                <p className="text-xs text-stone-500">NT${product.price}</p>
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.includes(searchTerm) ||
      order.customerName.includes(searchTerm) ||
      order.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === "全部" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateOrder = async (
    orderId: string,
    status: string,
    paymentStatus: string,
    faceToFace: string
  ) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus, faceToFace }),
      });
      if (res.ok) {
        setEditingOrderId(null);
        window.location.reload();
      }
    } catch (error) {
      console.error("更新訂單失敗:", error);
    }
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: 客戶購買明細
    const customerData: any[] = [];
    const productSales: { [key: string]: number } = {};

    orders.forEach((order) => {
      const items = parseItems(order.itemsDetail);
      items.forEach((item: any) => {
        customerData.push({
          "訂單編號": order.orderId,
          "客戶名稱": order.customerName,
          "客戶電話": order.customerPhone,
          "商品名稱": item.name,
          "購買數量": item.quantity,
          "單價": item.price,
          "小計": item.quantity * item.price,
          "訂單狀態": order.status,
          "付款狀態": order.paymentStatus,
          "訂單時間": new Date(order.createdTime).toLocaleString(),
        });

        productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
      });
    });

    const customerSheet = XLSX.utils.json_to_sheet(customerData);
    XLSX.utils.book_append_sheet(workbook, customerSheet, "客戶購買明細");

    // Sheet 2: 商品銷售統計
    const productData = Object.entries(productSales)
      .map(([name, quantity]) => ({
        "商品名稱": name,
        "總銷售數量": quantity,
      }))
      .sort((a, b) => b["總銷售數量"] - a["總銷售數量"]);

    const productSheet = XLSX.utils.json_to_sheet(productData);
    XLSX.utils.book_append_sheet(workbook, productSheet, "商品銷售統計");

    // 設定列寬
    customerSheet["!cols"] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 18 },
    ];
    productSheet["!cols"] = [{ wch: 15 }, { wch: 10 }];

    XLSX.writeFile(workbook, `訂單報表_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const parseItems = (itemsDetail: string): any[] => {
    try {
      return JSON.parse(itemsDetail);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 flex flex-col">
        <button
          onClick={exportToExcel}
          disabled={orders.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          匯出Excel報表
        </button>
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
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <p className="text-center text-sm text-stone-500 py-8">
            {orders.length === 0 ? "暫無訂單" : "未找到匹配的訂單"}
          </p>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl bg-stone-50 p-4 cursor-pointer transition hover:bg-stone-100"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{order.orderId}</p>
                  <p className="text-xs text-stone-500 mt-1">
                    {order.customerName} ({order.customerPhone})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-stone-900">
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
                <div className="mt-4 border-t border-stone-200 pt-4 space-y-2 text-xs text-stone-600">
                  <p><span className="font-medium text-stone-900">商品:</span> {order.itemsDetail}</p>
                  <p><span className="font-medium text-stone-900">重量:</span> {order.totalWeightKg} kg</p>
                  <p><span className="font-medium text-stone-900">匯款末五碼:</span> {order.paymentLast5 || "未提供"}</p>
                  {order.storeNumber && (
                    <p><span className="font-medium text-stone-900">7-11 店號:</span> {order.storeNumber}</p>
                  )}
                  <p><span className="font-medium text-stone-900">面交:</span> {order.faceToFace || "未提供"}</p>
                  <p><span className="font-medium text-stone-900">時間:</span> {new Date(order.createdTime).toLocaleString()}</p>

                  {editingOrderId === order.id ? (
                    <div className="mt-3 space-y-2">
                      <select
                        defaultValue={order.status}
                        id={`status-${order.id}`}
                        className="w-full px-2 py-1.5 text-xs rounded border border-stone-200"
                      >
                        <option value="新訂單">新訂單</option>
                        <option value="已出貨">已出貨</option>
                        <option value="已取消">已取消</option>
                      </select>
                      <select
                        defaultValue={order.paymentStatus}
                        id={`payment-${order.id}`}
                        className="w-full px-2 py-1.5 text-xs rounded border border-stone-200"
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
                        className="w-full px-2 py-1.5 text-xs rounded border border-stone-200"
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
                          className="flex-1 px-2 py-1.5 bg-stone-200 text-stone-700 rounded text-xs font-medium hover:bg-stone-300"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingOrderId(order.id)}
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

function ProductsTab({
  products,
  onEdit,
}: {
  products: Product[];
  onEdit: (product: Product) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");

  const filteredProducts = products.filter((product) => {
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
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 bg-white">
          <Search className="h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="搜尋商品名稱、品牌或分類..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm outline-none text-stone-900 placeholder:text-stone-400"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                categoryFilter === category
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <p className="text-center text-sm text-stone-500 py-8">
            {products.length === 0 ? "暫無商品" : "未找到匹配的商品"}
          </p>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-xl bg-stone-50 p-4 hover:bg-stone-100 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">{product.name}</p>
                  {product.brand && (
                    <p className="text-xs text-stone-500">{product.brand}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                      {product.category}
                    </span>
                    <span className="text-xs text-stone-600">
                      NT${product.price}
                    </span>
                    {product.totalSold > 0 && (
                      <span className="text-xs text-emerald-700 font-medium">
                        已售 {product.totalSold} 件
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
