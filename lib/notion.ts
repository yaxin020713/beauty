import { Client } from "@notionhq/client";

const apiKey = process.env.NOTION_API_KEY;
const productsDbId = process.env.NOTION_PRODUCTS_DB_ID;
const ordersDbId = process.env.NOTION_ORDERS_DB_ID;
const membersDbId = process.env.NOTION_MEMBERS_DB_ID;
const withdrawalsDbId = process.env.NOTION_WITHDRAWALS_DB_ID;
const productVariantsDbId = process.env.NOTION_PRODUCT_VARIANTS_DB_ID;

if (!apiKey || !productsDbId || !ordersDbId) {
  throw new Error(
    "缺少 Notion 環境變數，請確認 .env.local 內有 NOTION_API_KEY / NOTION_PRODUCTS_DB_ID / NOTION_ORDERS_DB_ID"
  );
}

if (!membersDbId) {
  console.warn(
    "未設置 NOTION_MEMBERS_DB_ID，推薦碼功能將不可用。請在 .env.local 中添加 NOTION_MEMBERS_DB_ID"
  );
}

if (!withdrawalsDbId) {
  console.warn(
    "未設置 NOTION_WITHDRAWALS_DB_ID，提現管理功能將不可用。請在 .env.local 中添加 NOTION_WITHDRAWALS_DB_ID"
  );
}

if (!productVariantsDbId) {
  console.warn(
    "未設置 NOTION_PRODUCT_VARIANTS_DB_ID，商品變體功能將不可用。請在 .env.local 中添加 NOTION_PRODUCT_VARIANTS_DB_ID"
  );
}

// 全域共用單一 Notion client
export const notion = new Client({ auth: apiKey });

export const PRODUCTS_DB_ID = productsDbId;
export const ORDERS_DB_ID = ordersDbId;
export const MEMBERS_DB_ID = membersDbId || "";
export const WITHDRAWALS_DB_ID = withdrawalsDbId || "";
export const PRODUCT_VARIANTS_DB_ID = productVariantsDbId || "";
