import { NextResponse } from "next/server";
import { fetchProducts, createProduct } from "@/lib/products";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, category, price, weight_g, cost50, cost100, image, description } = body;

    // 檢查是否為指定管理員
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "yaxinzhu2002@gmail.com";
    if (!email || email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json(
        { error: `權限不足，僅限管理員 (${adminEmail}) 上架商品` },
        { status: 403 }
      );
    }

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "請填寫商品名稱、價格與分類" },
        { status: 400 }
      );
    }

    await createProduct({
      name,
      category,
      price: Number(price),
      weight_g: Number(weight_g) || 0,
      cost50: Number(cost50) || 0,
      cost100: Number(cost100) || 0,
      image,
      description,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[api/products] 上架商品失敗:", error);
    return NextResponse.json(
      { error: "上架商品失敗，請稍後再試" },
      { status: 500 }
    );
  }
}

