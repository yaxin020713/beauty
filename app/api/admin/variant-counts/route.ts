import { NextResponse } from "next/server";
import { notion, PRODUCTS_DB_ID, PRODUCT_VARIANTS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

// 一次查完所有分頁（Notion 每次最多回傳 100 筆）
async function queryAll(databaseId: string) {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
      start_cursor: cursor,
    });
    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  return results;
}

// 管理員商品列表用：一次回傳每個商品的選項數量 { [product_id]: count }。
// 取代逐一呼叫 /api/products/[id]/variants，避免一次對 Notion 發出上百個請求而被限流。
export async function GET() {
  if (!PRODUCT_VARIANTS_DB_ID) {
    return NextResponse.json({ counts: {} }, { status: 200 });
  }

  try {
    const [products, variants] = await Promise.all([
      queryAll(PRODUCTS_DB_ID!),
      queryAll(PRODUCT_VARIANTS_DB_ID),
    ]);

    // 變體的 Product 欄位關聯的是商品的 Notion page id；前端商品用的是 product_id
    const productIdByPageId = new Map<string, string>();
    for (const page of products) {
      const prop = page.properties?.product_id;
      const productId = prop?.rich_text?.[0]?.plain_text || page.id;
      productIdByPageId.set(page.id, productId);
    }

    const counts: Record<string, number> = {};
    for (const page of variants) {
      const props = page.properties || {};
      // 跟 /api/products/[id]/variants 一致：沒有選項名稱的不算
      if (!props.Option_Name?.select?.name) continue;
      const pageId = props.Product?.relation?.[0]?.id;
      const productId = pageId && productIdByPageId.get(pageId);
      if (!productId) continue;
      counts[productId] = (counts[productId] || 0) + 1;
    }

    return NextResponse.json({ counts }, { status: 200 });
  } catch (error) {
    console.error("[api/admin/variant-counts] 查詢失敗:", error);
    return NextResponse.json({ error: "查詢商品選項數量失敗" }, { status: 500 });
  }
}
