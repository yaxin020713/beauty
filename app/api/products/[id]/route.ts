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

    const productId = params.id;

    // 先根據 product_id 查詢得到 Notion page ID
    const { notion, PRODUCTS_DB_ID } = await import("@/lib/notion");
    const productQuery = await notion.databases.query({
      database_id: PRODUCTS_DB_ID,
      filter: {
        property: "product_id",
        rich_text: {
          equals: productId,
        },
      },
      page_size: 1,
    });

    if (productQuery.results.length === 0) {
      return NextResponse.json(
        { error: "商品不存在" },
        { status: 404 }
      );
    }

    const notionPageId = productQuery.results[0].id;

    await updateProduct(notionPageId, productData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[api/products/:id PUT] 編輯商品失敗:", error);
    return NextResponse.json(
      { error: "編輯商品失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
