import { NextResponse } from "next/server";
import { fetchProducts } from "@/lib/products";

// 每次都即時讀取 Notion，避免快取舊資料
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await fetchProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[api/products] 讀取商品失敗:", error);
    return NextResponse.json(
      { error: "讀取商品失敗，請檢查 Notion API 設定" },
      { status: 500 }
    );
  }
}
