import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID } from "@/lib/notion";

// 前台購物車單一項目的型別
type CartItem = {
  productId: string;
  name: string;
  price: number;
  weight_g: number;
  quantity: number;
};

type OrderRequestBody = {
  customerName?: string;
  customerPhone?: string;
  paymentLast5?: string;
  items?: CartItem[];
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: OrderRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const customerName = (body.customerName ?? "").trim();
  const customerPhone = (body.customerPhone ?? "").trim();
  // 匯款末五碼：只保留數字並限 5 碼
  const paymentLast5 = String(body.paymentLast5 ?? "")
    .replace(/\D/g, "")
    .slice(-5);
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (!customerName || !customerPhone) {
    return NextResponse.json({ error: "請填寫姓名與電話" }, { status: 400 });
  }

  if (rawItems.length === 0) {
    return NextResponse.json({ error: "購物車是空的" }, { status: 400 });
  }

  // 清理並正規化購物車資料，避免前端傳入非法數值
  const items: CartItem[] = rawItems.map((item) => ({
    productId: String(item?.productId ?? ""),
    name: String(item?.name ?? ""),
    price: Number(item?.price) || 0,
    weight_g: Number(item?.weight_g) || 0,
    quantity: Math.max(1, Math.floor(Number(item?.quantity) || 0)),
  }));

  if (items.some((item) => !item.productId || !item.name)) {
    return NextResponse.json({ error: "購物車資料不完整" }, { status: 400 });
  }

  // 自動計算總金額與總重量（kg）
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalWeightKg = Number(
    items
      .reduce((sum, item) => sum + (item.weight_g * item.quantity) / 1000, 0)
      .toFixed(3)
  );

  // 組合商品明細文字，例："小黑瓶 x2, 白繃帶 x1"
  const itemsDetail = items
    .map((item) => `${item.name} x${item.quantity}`)
    .join(", ");

  const orderId = `訂單-${Date.now()}`;

  try {
    // 1. 建立訂單頁面
    await notion.pages.create({
      parent: { database_id: ORDERS_DB_ID },
      properties: {
        Order_ID: { title: [{ text: { content: orderId } }] },
        Customer_Name: { rich_text: [{ text: { content: customerName } }] },
        Customer_Phone: { rich_text: [{ text: { content: customerPhone } }] },
        Payment_Last5: { rich_text: [{ text: { content: paymentLast5 } }] },
        Payment_Status: { select: { name: "待核帳" } },
        Items_Detail: { rich_text: [{ text: { content: itemsDetail } }] },
        Total_Price: { number: totalPrice },
        Total_Weight_kg: { number: totalWeightKg },
        Status: { select: { name: "新訂單" } },
      },
    });

    // 2. 逐項更新商品的 Total_Sold（累加購買數量）
    for (const item of items) {
      const productPage = await notion.pages.retrieve({
        page_id: item.productId,
      });

      let currentSold = 0;
      if ("properties" in productPage) {
        const prop = productPage.properties["Total_Sold"];
        if (prop?.type === "number") {
          currentSold = prop.number ?? 0;
        }
      }

      await notion.pages.update({
        page_id: item.productId,
        properties: {
          Total_Sold: { number: currentSold + item.quantity },
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        orderId,
        totalPrice,
        totalWeightKg,
        itemsDetail,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/orders] 建立訂單失敗:", error);
    return NextResponse.json(
      { error: "建立訂單失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
