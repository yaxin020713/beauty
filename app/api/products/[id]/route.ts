import { NextResponse } from "next/server";
import { fetchProductByProductId, updateProduct } from "@/lib/products";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await fetchProductByProductId(params.id);
    if (!product) {
      return NextResponse.json(
        { error: "商品不存在" },
        { status: 404 }
      );
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[api/products/:id GET] 讀取商品失敗:", error);
    return NextResponse.json(
      { error: "讀取商品失敗" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { email, ...productData } = body;

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "yaxinzhu2002@gmail.com";
    if (!email || email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json(
        { error: `權限不足，僅限管理員 (${adminEmail}) 編輯商品` },
        { status: 403 }
      );
    }

    await updateProduct(params.id, productData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[api/products/:id] 編輯商品失敗:", error);
    return NextResponse.json(
      { error: "編輯商品失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
