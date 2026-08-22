import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "需要提供 email 參數" },
      { status: 400 }
    );
  }

  if (!ORDERS_DB_ID) {
    return NextResponse.json(
      { error: "系統配置不完整" },
      { status: 500 }
    );
  }

  try {
    const queryResponse = await notion.databases.query({
      database_id: ORDERS_DB_ID,
      filter: {
        property: "聯繫用Email",
        rich_text: {
          equals: email.toLowerCase(),
        },
      },
      sorts: [
        {
          property: "訂單狀態",
          direction: "ascending",
        },
      ],
    });

    const orders = queryResponse.results.map((page: any) => {
      if (!("properties" in page)) return null;

      const props = page.properties;
      return {
        id: page.id,
        orderId: props.Order_ID?.title?.[0]?.plain_text || "",
        date: page.created_time,
        customerName: props.Customer_Name?.rich_text?.[0]?.plain_text || "",
        customerPhone: props.Customer_Phone?.rich_text?.[0]?.plain_text || "",
        itemsDetail: props.Items_Detail?.rich_text?.[0]?.plain_text || "",
        totalPrice: props.Total_Price?.number || 0,
        orderStatus: props.訂單狀態?.select?.name || "未知",
        shippingMethod: props["7-11取貨店號"]?.rich_text?.[0]?.plain_text
          ? "convenience_711"
          : "face_to_face",
        store7_11: props["7-11取貨店號"]?.rich_text?.[0]?.plain_text || "",
      };
    }).filter(Boolean);

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("[api/orders/my-orders GET]:", error);
    return NextResponse.json(
      { error: "無法查詢訂單" },
      { status: 500 }
    );
  }
}
