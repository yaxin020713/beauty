import { BANK_INFO } from "./bank";

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  enabled: boolean;
}

export interface NotificationData {
  customerName: string;
  customerEmail: string;
  batchName: string;
  totalPrice: number;
  paymentDeadline: string;
  estimatedShipDate: string;
}

// 預設模板（後續會改為從 Notion 讀取）
export const DEFAULT_TEMPLATES: Record<string, NotificationTemplate> = {
  payment: {
    id: "payment",
    name: "付款通知",
    subject: "【美妝預訂】{{批次名稱}} - 請於 {{截止日期}} 前付款",
    body: `親愛的 {{客戶名稱}}，

感謝您的預訂！本月批次已確認，請於 {{截止日期}} 前完成付款。

📋 訂單詳情
─────────────────────────
批次名稱：{{批次名稱}}
應付金額：NT$ {{應付金額}}
付款截止日：{{截止日期}}
預計出貨日：{{預計出貨日}}

💳 匯款資訊
─────────────────────────
銀行：{{銀行名稱}}
帳號：{{銀行帳號}}

✅ 完成付款後
─────────────────────────
1. 回到本網站登入您的帳號
2. 進入「我的訂單」找到此筆訂單
3. 輸入您的匯款末五碼
4. 點擊「已匯款」確認

如有任何問題，歡迎聯絡我們。

祝您購物愉快！`,
    enabled: true,
  },
  shipment: {
    id: "shipment",
    name: "出貨通知",
    subject: "【美妙預訂】{{批次名稱}} - 預計於 {{預計出貨日}} 出貨",
    body: `親愛的 {{客戶名稱}}，

好消息！您的訂單已確認出貨。

📦 出貨資訊
─────────────────────────
批次名稱：{{批次名稱}}
應付金額：NT$ {{應付金額}}
預計出貨日：{{預計出貨日}}

📍 收貨方式
─────────────────────────
詳見您的訂單詳情頁面

🔗 查看訂單
─────────────────────────
請登入本網站，進入「我的訂單」查看完整資訊。

感謝您的支持！`,
    enabled: true,
  },
};

/**
 * 用模板變數替換訊息內容
 */
export function renderTemplate(
  template: string,
  data: NotificationData & { bankName: string; bankAccount: string }
): string {
  return template
    .replace(/{{客戶名稱}}/g, data.customerName)
    .replace(/{{批次名稱}}/g, data.batchName)
    .replace(/{{應付金額}}/g, data.totalPrice.toString())
    .replace(/{{截止日期}}/g, data.paymentDeadline)
    .replace(/{{預計出貨日}}/g, data.estimatedShipDate)
    .replace(/{{銀行名稱}}/g, data.bankName)
    .replace(/{{銀行帳號}}/g, data.bankAccount);
}

/**
 * 生成通知郵件記錄
 */
export function generateNotificationEmail(
  template: NotificationTemplate,
  data: NotificationData
) {
  const enrichedData = {
    ...data,
    bankName: BANK_INFO.bankName,
    bankAccount: BANK_INFO.account,
  };

  const subject = renderTemplate(template.subject, enrichedData);
  const body = renderTemplate(template.body, enrichedData);

  return {
    email: data.customerEmail,
    subject,
    body,
  };
}
