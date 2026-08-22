import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentLast5 } = body;

    if (!orderId || !paymentLast5) {
      return NextResponse.json(
        { error: "缺少必要信息" },
        { status: 400 }
      );
    }

    if (!ORDERS_DB_ID) {
      return NextResponse.json(
        { error: "系統配置不完整" },
        { status: 500 }
      );
    }

    // 查詢訂單
    const queryResponse = await notion.databases.query({
      database_id: ORDERS_DB_ID,
      filter: {
        property: "Order_ID",
        title: { equals: orderId },
      },
      page_size: 1,
    });

    if (queryResponse.results.length === 0) {
      return NextResponse.json(
        { error: "訂單不存在" },
        { status: 404 }
      );
    }

    const orderPageId = queryResponse.results[0].id;

    // 更新訂單
    await notion.pages.update({
      page_id: orderPageId,
      properties: {
        "帳號末5碼": {
          number: Number(paymentLast5.replace(/\D/g, "").slice(-5)),
        },
        "訂單狀態": {
          select: { name: "已付款" },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "付款資訊已更新",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/orders/update-payment PATCH]:", error);
    return NextResponse.json(
      { error: "更新失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
