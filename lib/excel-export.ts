/**
 * 生成 CSV 格式的通知清單
 * （使用 CSV 而非 XLSX 是因為無需額外依賴）
 */
export interface NotificationRecord {
  email: string;
  subject: string;
  body: string;
}

/**
 * 將通知清單轉換為 CSV 格式
 * 注意：保留換行符以支持複行郵件內容
 */
export function generateCSV(records: NotificationRecord[]): string {
  if (records.length === 0) return "";

  // CSV 表頭
  const headers = ["Email", "主旨", "內文"];
  const headerRow = headers.map((h) => `"${h}"`).join(",");

  // CSV 行數據（使用雙引號包裹以支持換行和逗號）
  const dataRows = records
    .map((record) => {
      const email = `"${record.email.replace(/"/g, '""')}"`;
      const subject = `"${record.subject.replace(/"/g, '""')}"`;
      const body = `"${record.body.replace(/"/g, '""').replace(/\n/g, "\\n")}"`;
      return [email, subject, body].join(",");
    })
    .join("\n");

  return `${headerRow}\n${dataRows}`;
}

/**
 * 生成文件名（帶時間戳）
 */
export function generateFileName(batchName: string, type: "payment" | "shipment"): string {
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const typeLabel = type === "payment" ? "付款通知" : "出貨通知";
  return `${batchName}_${typeLabel}_${timestamp}.csv`;
}

/**
 * 生成下載所需的 Blob
 */
export function generateDownloadBlob(csv: string): Blob {
  // 使用 UTF-8 BOM 以便 Excel 正確識別中文編碼
  const BOM = "﻿";
  return new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
}
