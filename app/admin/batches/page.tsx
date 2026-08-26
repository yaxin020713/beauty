"use client";

import { useState } from "react";
import { Loader2, Download, Eye } from "lucide-react";

interface NotificationPreview {
  email: string;
  subject: string;
  body: string;
}

interface PreviewData {
  total: number;
  preview: NotificationPreview[];
}

export default function AdminBatchesPage() {
  const [batchId, setBatchId] = useState("");
  const [notificationType, setNotificationType] = useState<"payment" | "shipment">("payment");
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = async () => {
    if (!batchId.trim()) {
      alert("請輸入批次 ID");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/batches/${batchId}/notifications/export?type=${notificationType}&format=preview`
      );
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setShowPreview(true);
      } else {
        const error = await res.json();
        alert(`預覽失敗: ${error.error}`);
      }
    } catch (error) {
      alert(`錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!batchId.trim()) {
      alert("請輸入批次 ID");
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
        a.download = res.headers.get("content-disposition")?.split("filename=")[1]?.replaceAll('"', "") || "notifications.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await res.json();
        alert(`導出失敗: ${error.error}`);
      }
    } catch (error) {
      alert(`錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif font-normal mb-2">批次通知管理</h1>
        <p className="text-taupe-600 mb-8">生成並導出客戶通知郵件清單</p>

        {/* 輸入表單 */}
        <div className="bg-taupe-50 rounded-2xl p-8 mb-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-taupe-900">
              批次 ID
            </label>
            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="輸入批次 ID（例如：batch-2026-08）"
              className="w-full px-4 py-3 border border-taupe-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sapphire-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-taupe-900">
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
                  className="w-4 h-4"
                />
                <span className="text-taupe-700">付款通知</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="shipment"
                  checked={notificationType === "shipment"}
                  onChange={(e) => setNotificationType(e.target.value as "shipment")}
                  className="w-4 h-4"
                />
                <span className="text-taupe-700">出貨通知</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={loading || !batchId.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-sapphire-100 text-sapphire-700 font-medium rounded-xl hover:bg-sapphire-200 disabled:bg-taupe-300 disabled:text-taupe-600 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              預覽
            </button>
            <button
              onClick={handleExport}
              disabled={loading || !batchId.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-taupe-900 text-white font-medium rounded-xl hover:bg-taupe-800 disabled:bg-taupe-400 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              導出 CSV
            </button>
          </div>
        </div>

        {/* 預覽表格 */}
        {showPreview && previewData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-taupe-900">
                預覽（共 {previewData.total} 筆）
              </h2>
              <p className="text-sm text-taupe-600">
                {previewData.total > previewData.preview.length
                  ? `顯示前 ${previewData.preview.length} 筆`
                  : "全部"}
              </p>
            </div>

            <div className="overflow-x-auto border border-taupe-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-taupe-100 border-b border-taupe-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-taupe-900">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-taupe-900">主旨</th>
                    <th className="px-4 py-3 text-left font-semibold text-taupe-900">內文預覽</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview.map((item, idx) => (
                    <tr key={idx} className="border-b border-taupe-100 hover:bg-taupe-50">
                      <td className="px-4 py-3 text-taupe-700">{item.email}</td>
                      <td className="px-4 py-3 text-taupe-700 max-w-xs truncate">
                        {item.subject}
                      </td>
                      <td className="px-4 py-3 text-taupe-600 max-w-xs truncate">
                        {item.body.substring(0, 50)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-taupe-600 text-center">
              點擊「導出 CSV」下載完整清單，即可在 Excel 中複製貼上發送郵件
            </p>
          </div>
        )}

        {/* 說明 */}
        <div className="mt-12 p-6 bg-blue-50 rounded-xl text-sm text-blue-700">
          <p className="font-semibold mb-2">📖 使用說明</p>
          <ul className="list-disc list-inside space-y-1">
            <li>輸入批次 ID 並選擇通知類型</li>
            <li>點擊「預覽」查看即將發送的郵件內容</li>
            <li>點擊「導出 CSV」下載 Excel 檔案</li>
            <li>在 Excel 中複製郵件內容，貼到郵件客戶端發送</li>
            <li>無需修改 - 所有變數已自動帶入！</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
