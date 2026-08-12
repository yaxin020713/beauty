// E2E 驗證腳本：
//   1) 讀取 .env.local 的 Notion 設定
//   2) 透過本機 Next 伺服器呼叫 GET /api/products 與 POST /api/orders
//   3) 驗證訂單寫入 Notion Orders、Total_Sold 有累加
//   4) 自動清理測試資料（刪除測試訂單、還原 Total_Sold）
// 使用方式：先啟動 npm run dev（或 npm run build + npm start），再執行 npm run e2e:test
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

// ---------- 讀取 .env.local ----------
const env = {};
for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { NOTION_API_KEY, NOTION_PRODUCTS_DB_ID, NOTION_ORDERS_DB_ID } = env;
const BASE_URL = process.env.NOTION_API_BASE ?? "https://api.notion.com/v1";
const SERVER = process.env.SERVER_URL ?? "http://localhost:3000";

const headers = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function notion(pathname, options = {}) {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion ${pathname} -> ${res.status}: ${text}`);
  }
  return res.json();
}

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`${ok ? "✅" : "❌"} ${label} ${detail}`);
  if (!ok) failures += 1;
}

// 記錄測試建立的訂單與需還原的商品，供 finally 清理
const createdOrderId = { value: null };
const itemsToRestore = [];
const originals = new Map();

try {
  // ---------- 1. 測試 GET /api/products ----------
  const productsRes = await fetch(`${SERVER}/api/products`);
  const productsData = await productsRes.json();
  check(
    "GET /api/products 回傳 200 且 products 為陣列",
    productsRes.ok && Array.isArray(productsData.products)
  );
  if (!Array.isArray(productsData.products)) {
    console.error("products response:", JSON.stringify(productsData, null, 2));
    process.exit(1);
  }
  console.log(`   共 ${productsData.products.length} 件商品`);
  check(
    "商品資料含 name/price/weight_g 欄位",
    productsData.products.every(
      (p) =>
        typeof p.name === "string" &&
        typeof p.price === "number" &&
        typeof p.weight_g === "number"
    )
  );

  // ---------- 2. 直接讀取 Notion 取得商品原始 Total_Sold ----------
  const dbQuery = await notion(`/databases/${NOTION_PRODUCTS_DB_ID}/query`, {
    method: "POST",
    body: JSON.stringify({ page_size: 3 }),
  });
  const samplePages = dbQuery.results;
  if (samplePages.length === 0) throw new Error("Products 資料庫是空的，無法測試");

  for (const page of samplePages) {
    const prop = page.properties?.["Total_Sold"];
    originals.set(page.id, prop?.type === "number" ? prop.number ?? 0 : 0);
  }

  // ---------- 3. 測試 POST /api/orders ----------
  const items = samplePages.map((page, i) => {
    const title = page.properties["Name"]?.title?.[0]?.plain_text ?? "未知商品";
    const price =
      page.properties["Price"]?.type === "number"
        ? page.properties["Price"].number ?? 0
        : 0;
    const weight =
      page.properties["Weight_g"]?.type === "number"
        ? page.properties["Weight_g"].number ?? 0
        : 0;
    return {
      productId: page.id,
      name: title,
      price,
      weight_g: weight,
      quantity: i + 1,
    };
  });
  itemsToRestore.push(...items);

  const createRes = await fetch(`${SERVER}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: `E2E測試客戶${Date.now()}`,
      customerPhone: "0912345678",
      items,
    }),
  });
  const createData = await createRes.json();
  check(
    "POST /api/orders 回傳 201 且 success=true",
    createRes.status === 201 && createData.success === true,
    JSON.stringify(createData)
  );
  if (createRes.status !== 201) process.exit(1);
  createdOrderId.value = createData.orderId;

  const expectedPrice = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const expectedWeight = Number(
    items
      .reduce((s, it) => s + (it.weight_g * it.quantity) / 1000, 0)
      .toFixed(3)
  );
  check(
    "Total_Price 計算正確",
    createData.totalPrice === expectedPrice,
    `expected ${expectedPrice}, got ${createData.totalPrice}`
  );
  check(
    "Total_Weight_kg 計算正確",
    createData.totalWeightKg === expectedWeight,
    `expected ${expectedWeight}, got ${createData.totalWeightKg}`
  );

  // ---------- 4. 驗證訂單真的寫入 Notion ----------
  const orderQuery = await notion(`/databases/${NOTION_ORDERS_DB_ID}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: "Order_ID",
        title: { equals: createdOrderId.value },
      },
    }),
  });
  const createdOrder = orderQuery.results[0];
  check("訂單頁面已寫入 Notion Orders", !!createdOrder);
  if (!createdOrder) process.exit(1);
  check(
    "Items_Detail 格式正確",
    createdOrder.properties["Items_Detail"]?.rich_text?.[0]?.plain_text ===
      items.map((it) => `${it.name} x${it.quantity}`).join(", ")
  );
  const status = createdOrder.properties["Status"]?.select?.name;
  check("Status 為「新訂單」", status === "新訂單", `got ${status}`);

  // ---------- 5. 驗證 Total_Sold 累加 ----------
  for (const item of items) {
    const page = await notion(`/pages/${item.productId}`);
    const prop = page.properties["Total_Sold"];
    const current = prop?.type === "number" ? prop.number ?? 0 : 0;
    const expected = originals.get(item.productId) + item.quantity;
    check(
      `Total_Sold 累加（${item.name}）`,
      current === expected,
      `${originals.get(item.productId)} -> ${current}`
    );
  }
} finally {
  // ---------- 6. 清理測試資料 ----------
  console.log("\n--- 清理測試資料 ---");

  if (createdOrderId.value) {
    try {
      const q = await notion(`/databases/${NOTION_ORDERS_DB_ID}/query`, {
        method: "POST",
        body: JSON.stringify({
          filter: {
            property: "Order_ID",
            title: { equals: createdOrderId.value },
          },
        }),
      });
      for (const order of q.results) {
        // Notion API 已移除 DELETE /pages，改用 PATCH archived:true 封存
        await notion(`/pages/${order.id}`, {
          method: "PATCH",
          body: JSON.stringify({ archived: true }),
        });
        console.log(`已封存測試訂單 ${createdOrderId.value}`);
      }
    } catch (e) {
      console.warn("清理訂單失敗:", e.message);
    }
  }

  for (const item of itemsToRestore) {
    try {
      await notion(`/pages/${item.productId}`, {
        method: "PATCH",
        body: JSON.stringify({
          properties: { Total_Sold: { number: originals.get(item.productId) } },
        }),
      });
      console.log(`已還原 Total_Sold（${item.name}）`);
    } catch (e) {
      console.warn(`還原 Total_Sold（${item.name}）失敗:`, e.message);
    }
  }
}

console.log(
  `\n${failures === 0 ? "🎉 全部測試通過！" : `⚠️ ${failures} 項測試失敗`}`
);
process.exit(failures === 0 ? 0 : 1);
