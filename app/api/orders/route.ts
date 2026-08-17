import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID } from "@/lib/notion";
import { SHIPPING_COSTS, type ShippingMethod } from "@/lib/shipping";

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
  shippingMethod?: string;
  selectedStore?: string;
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
  const shippingMethod = (body.shippingMethod ?? "convenience_711") as ShippingMethod;
  const selectedStore = (body.selectedStore ?? "").trim();

  if (!customerName || !customerPhone) {
    return NextResponse.json({ error: "請填寫姓名與電話" }, { status: 400 });
  }

  if (rawItems.length === 0) {
    return NextResponse.json({ error: "購物車是空的" }, { status: 400 });
  }

  // 驗證收貨方式
  if (shippingMethod === "convenience_711" && !selectedStore) {
    return NextResponse.json({ error: "請選擇 7-11 超商門市" }, { status: 400 });
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

  // 自動計算運費（後端重新計算，不信任前端值）
  const shippingFee = shippingMethod === "convenience_711" ? SHIPPING_COSTS.CONVENIENCE_711 : SHIPPING_COSTS.FACE_TO_FACE;

  // 自動計算總金額與總重量（kg）
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalPrice = subtotal + shippingFee;
  const totalWeightKg = Number(
    items
      .reduce((sum, item) => sum + (item.weight_g * item.quantity) / 1000, 0)
      .toFixed(3)
  );

  // 組合收貨方式資訊
  const shippingInfo = shippingMethod === "convenience_711"
    ? `7-11 超商取貨 (門市編號: ${selectedStore})`
    : "面交";

  // 組合商品明細文字，附上該商品此訂單的總重量，例："小黑瓶 x2（200g）, 白繃帶 x1（50g）"
  const itemsDetail = items
    .map((item) => `${item.name} x${item.quantity}（${item.weight_g * item.quantity}g）`)
    .join(", ");

  const orderId = `訂單-${Date.now()}`;

  try {
    // 1. 建立訂單頁面
    // 在 Items_Detail 中附加運費、收貨方式與匯款末五碼資訊
    const detailWithShipping = `${itemsDetail}\n運費: ${shippingFee > 0 ? `NT$${shippingFee}` : "免運"} | 取貨: ${shippingInfo}\n匯款末五碼: ${paymentLast5}`;

    const properties: Record<string, any> = {
      Order_ID: { title: [{ text: { content: orderId } }] },
      Customer_Name: { rich_text: [{ text: { content: customerName } }] },
      Customer_Phone: { rich_text: [{ text: { content: customerPhone } }] },
      Items_Detail: { rich_text: [{ text: { content: detailWithShipping } }] },
      Total_Price: { number: totalPrice },
      Total_Weight_kg: { number: totalWeightKg },
      "訂單狀態": { select: { name: "新訂單" } },
    };

    // 7-11 取貨：寫入門市店號；面交：於面交否欄位標記「面交」
    if (shippingMethod === "convenience_711") {
      properties["7-11取貨店號"] = { rich_text: [{ text: { content: selectedStore } }] };
    } else if (shippingMethod === "face_to_face") {
      properties["面交否"] = { rich_text: [{ text: { content: "面交" } }] };
    }

    // 帳號末5碼（數字型別）
    if (paymentLast5) {
      properties["帳號末5碼"] = { number: Number(paymentLast5) };
    }

    await notion.pages.create({
      parent: { database_id: ORDERS_DB_ID },
      properties,
    });

    // 2. 逐項更新商品的 Total_Sold（累加購買數量）
    for (const item of items) {
      try {
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
      } catch (error) {
        // 如果產品不存在或無法更新，繼續處理其他訂單項目
        console.warn(`[api/orders] 無法更新商品 ${item.productId} 的銷量:`, error instanceof Error ? error.message : error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        orderId,
        totalPrice,
        totalWeightKg,
        shippingFee,
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
