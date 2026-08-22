import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID, PRODUCTS_DB_ID, updateProductReservedQuantity } from "@/lib/notion";

interface ReservationItem {
  productId: string;
  productName: string;
  variant?: { optionName: string };
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      items,
      customerName,
      customerPhone,
      customerEmail,
      store7_11,
    } = body;

    // 验证必填字段
    if (
      !Array.isArray(items) ||
      items.length === 0 ||
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

    // 生成 Items_Detail 字符串（多行格式）
    const itemsDetail = items
      .map((item: ReservationItem) =>
        item.variant
          ? `${item.productName} (${item.variant.optionName}) x${item.quantity}`
          : `${item.productName} x${item.quantity}`
      )
      .join("\n");

    // 保存到 Orders 表
    await notion.pages.create({
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

    // 为每个商品更新 Reserved_Quantity
    for (const item of items) {
      try {
        // 查询该商品的 Notion page ID
        const productQuery = await notion.databases.query({
          database_id: PRODUCTS_DB_ID,
          filter: {
            property: "product_id",
            rich_text: {
              equals: item.productId,
            },
          },
          page_size: 1,
        });

        if (productQuery.results.length > 0) {
          const productPageId = productQuery.results[0].id;
          await updateProductReservedQuantity(productPageId, item.quantity);
        }
      } catch (itemError) {
        console.error(
          `[api/reservations] 更新商品 ${item.productId} 的 Reserved_Quantity 失敗:`,
          itemError
        );
        // 继续处理其他商品，不中断流程
      }
    }

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
