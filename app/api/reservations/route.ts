import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID } from "@/lib/notion";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productName,
      productId,
      variant,
      quantity,
      customerName,
      customerPhone,
      customerEmail,
      store7_11,
    } = body;

    // 验证必填字段
    if (
      !productName ||
      !productId ||
      !quantity ||
      !customerName ||
      !customerPhone ||
      !customerEmail ||
      !store7_11
    ) {
      return NextResponse.json(
        { error: "缺少必要信息" },
        { status: 400 }
      );
    }

    // 生成 Order_ID
    const orderId = `訂單-${Date.now()}`;

    // 生成 Items_Detail 字符串
    const itemsDetail = variant
      ? `${productName} (${variant.optionName}) x${quantity}`
      : `${productName} x${quantity}`;

    // 保存到 Orders 表
    const response = await notion.pages.create({
      parent: { database_id: ORDERS_DB_ID },
      properties: {
        "Order_ID": {
          title: [{ text: { content: orderId } }],
        },
        "Customer_Name": {
          rich_text: [{ text: { content: customerName } }],
        },
        "Customer_Phone": {
          rich_text: [{ text: { content: customerPhone } }],
        },
        "Items_Detail": {
          rich_text: [{ text: { content: itemsDetail } }],
        },
        "聯絡郵箱": {
          rich_text: [{ text: { content: customerEmail } }],
        },
        "7-11超商貨號": {
          rich_text: [{ text: { content: store7_11 } }],
        },
        "Payment_Status": {
          select: { name: "待聯繫" },
        },
      } as Record<string, any>,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: orderId,
        message: "預訂成功，請等待我們的聯繫",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/reservations] 預訂失敗:", error);
    return NextResponse.json(
      { error: "預訂失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
