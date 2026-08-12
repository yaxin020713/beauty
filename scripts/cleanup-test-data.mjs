// 清理 E2E 測試留下的資料：
//   1) 找出 Orders 資料庫中 Customer_Name 以「E2E測試客戶」開頭的測試訂單（含已封存）
//   2) 依 Items_Detail 將對應商品的 Total_Sold 扣回
//   3) 將測試訂單封存（archive）
// 用法：node scripts/cleanup-test-data.mjs
import fs from "node:fs";
import path from "node:path";
import { Client } from "@notionhq/client";

const ROOT = path.resolve(import.meta.dirname, "..");

const env = {};
for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const client = new Client({ auth: env.NOTION_API_KEY });

// 1) 找出測試訂單（含已封存）
const orderQuery = await client.databases.query({
  database_id: env.NOTION_ORDERS_DB_ID,
  filter: {
    property: "Customer_Name",
    rich_text: { starts_with: "E2E測試客戶" },
  },
  page_size: 50,
  include_archived: true,
});

console.log(`找到 ${orderQuery.results.length} 筆測試訂單`);

for (const order of orderQuery.results) {
  const title = order.properties["Order_ID"]?.type === "title"
    ? order.properties["Order_ID"].title.map((t) => t.plain_text).join("")
    : "";
  const itemsDetail =
    order.properties["Items_Detail"]?.type === "rich_text"
      ? order.properties["Items_Detail"].rich_text.map((t) => t.plain_text).join("")
      : "";

  // 2) 依 Items_Detail 還原 Total_Sold
  if (itemsDetail) {
    const productQuery = await client.databases.query({
      database_id: env.NOTION_PRODUCTS_DB_ID,
    });
    const productPages = productQuery.results;

    for (const raw of itemsDetail.split(",")) {
      const m = raw.trim().match(/^(.+?)\s*x(\d+)$/);
      if (!m) continue;
      const [, name, qtyStr] = m;
      const qty = Number(qtyStr);
      const page = productPages.find(
        (p) => p.properties["Name"]?.type === "title" &&
          p.properties["Name"].title[0]?.plain_text === name
      );
      if (!page) {
        console.log(`  ⚠️ 找不到商品「${name}」，略過`);
        continue;
      }
      const current = page.properties["Total_Sold"]?.type === "number"
        ? (page.properties["Total_Sold"].number ?? 0)
        : 0;
      const next = Math.max(0, current - qty);
      await client.pages.update({
        page_id: page.id,
        properties: { Total_Sold: { number: next } },
      });
      console.log(`  還原 Total_Sold：${name} ${current} -> ${next}`);
    }
  }

  // 3) 封存測試訂單
  await client.pages.update({ page_id: order.id, archived: true });
  console.log(`  已封存測試訂單：${title}`);
}

console.log("清理完成");
