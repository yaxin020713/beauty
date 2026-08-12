import { Client } from "@notionhq/client";

const apiKey = process.env.NOTION_API_KEY;
const productsDbId = process.env.NOTION_PRODUCTS_DB_ID;
const ordersDbId = process.env.NOTION_ORDERS_DB_ID;

if (!apiKey || !productsDbId || !ordersDbId) {
  throw new Error(
    "缺少 Notion 環境變數，請確認 .env.local 內有 NOTION_API_KEY / NOTION_PRODUCTS_DB_ID / NOTION_ORDERS_DB_ID"
  );
}

// 全域共用單一 Notion client
export const notion = new Client({ auth: apiKey });

export const PRODUCTS_DB_ID = productsDbId;
export const ORDERS_DB_ID = ordersDbId;
