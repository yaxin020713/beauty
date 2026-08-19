import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");

    // 查詢所有訂單
    const response = await notion.databases.query({
      database_id: ORDERS_DB_ID,
      sorts: [
        {
          property: "Order_ID",
          direction: "descending",
        },
      ],
    });

    let orders = response.results.map((page) => {
      if (!("properties" in page)) return null;

      const props = page.properties;
      const orderId =
        props.Order_ID?.type === "title" && Array.isArray(props.Order_ID.title)
          ? props.Order_ID.title[0]?.plain_text || ""
          : "";
      const customerName =
        props.Customer_Name?.type === "rich_text" && Array.isArray(props.Customer_Name.rich_text)
          ? props.Customer_Name.rich_text[0]?.plain_text || ""
          : "";
      const customerPhone =
        props.Customer_Phone?.type === "rich_text" && Array.isArray(props.Customer_Phone.rich_text)
          ? props.Customer_Phone.rich_text[0]?.plain_text || ""
          : "";
      const customerEmail =
        props["聯繫用Email"]?.type === "rich_text" && Array.isArray(props["聯繫用Email"].rich_text)
          ? props["聯繫用Email"].rich_text[0]?.plain_text || ""
          : "";
      const paymentLast5Number =
        props["帳號末5碼"]?.type === "number" ? props["帳號末5碼"].number : null;
      const paymentLast5 =
        paymentLast5Number !== null
          ? String(paymentLast5Number).padStart(5, "0")
          : props.Payment_Last5?.type === "rich_text" && Array.isArray(props.Payment_Last5.rich_text)
          ? props.Payment_Last5.rich_text[0]?.plain_text || ""
          : "";
      const itemsDetail =
        props.Items_Detail?.type === "rich_text" && Array.isArray(props.Items_Detail.rich_text)
          ? props.Items_Detail.rich_text[0]?.plain_text || ""
          : "";
      const totalPrice =
        props.Total_Price?.type === "number" ? props.Total_Price.number || 0 : 0;
      const totalWeightKg =
        props.Total_Weight_kg?.type === "number"
          ? props.Total_Weight_kg.number || 0
          : 0;
      const orderStatus =
        props["訂單狀態"]?.type === "select" && props["訂單狀態"].select
          ? (props["訂單狀態"].select as any).name || ""
          : "";
      const paymentStatus =
        props["付款狀態"]?.type === "select" && props["付款狀態"].select
          ? (props["付款狀態"].select as any).name || ""
          : "";
      const storeNumber =
        props["7-11取貨店號"]?.type === "rich_text" && Array.isArray(props["7-11取貨店號"].rich_text)
          ? props["7-11取貨店號"].rich_text[0]?.plain_text || ""
          : "";
      const faceToFace =
        props["面交否"]?.type === "rich_text" && Array.isArray(props["面交否"].rich_text)
          ? props["面交否"].rich_text[0]?.plain_text || ""
          : "";
      const shippingDate =
        props["出貨日期"]?.type === "date" && props["出貨日期"].date
          ? props["出貨日期"].date.start || ""
          : "";
      const createdTime = (page as any).created_time || "";

      return {
        id: page.id,
        orderId,
        customerName,
        customerPhone,
        customerEmail,
        paymentLast5,
        itemsDetail,
        totalPrice,
        totalWeightKg,
        status: orderStatus,
        paymentStatus,
        storeNumber,
        faceToFace,
        shippingDate,
        createdTime,
      };
    });

    const validOrders = orders.filter((order): order is NonNullable<typeof order> => order !== null);

    // 過濾訂單狀態
    let filteredOrders = validOrders;
    if (status) {
      filteredOrders = filteredOrders.filter((order) => order.status === status);
    }

    // 限制返回數量
    orders = filteredOrders.slice(0, limit);

    return NextResponse.json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error("[api/admin/orders] 獲取訂單失敗:", error);
    return NextResponse.json(
      { error: "獲取訂單失敗" },
      { status: 500 }
    );
  }
}
