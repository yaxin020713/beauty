import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID } from "@/lib/notion";
import { DEFAULT_TEMPLATES, renderTemplate } from "@/lib/notification-templates";
import { BANK_INFO } from "@/lib/bank";

const PENDING_EMAILS_DB_ID = process.env.NOTION_PENDING_EMAILS_DB_ID;

type GenerateEmailsRequest = {
  orderIds: string[];
  templateType: "payment" | "shipment";
  batchName?: string;
  paymentDeadline?: string;
  estimatedShipDate?: string;
};

async function getOrderData(orderId: string) {
  try {
    const response = await notion.databases.query({
      database_id: ORDERS_DB_ID,
      filter: {
        property: "Order_ID",
        rich_text: { equals: orderId },
      },
      page_size: 1,
    });

    if (response.results.length === 0) return null;

    const order = response.results[0];
    if (!("properties" in order)) return null;

    const props = order.properties;
    return {
      orderId:
        props.Order_ID?.type === "title" && Array.isArray(props.Order_ID.title)
          ? props.Order_ID.title[0]?.plain_text || ""
          : "",
      customerName:
        props.Customer_Name?.type === "rich_text" && Array.isArray(props.Customer_Name.rich_text)
          ? props.Customer_Name.rich_text[0]?.plain_text || ""
          : "",
      customerEmail:
        props["聯繫用Email"]?.type === "rich_text" && Array.isArray(props["聯繫用Email"].rich_text)
          ? props["聯繫用Email"].rich_text[0]?.plain_text || ""
          : "",
      totalPrice: props.Total_Price?.type === "number" && typeof props.Total_Price.number === "number" ? props.Total_Price.number : 0,
      itemsDetail:
        props.Items_Detail?.type === "rich_text" && Array.isArray(props.Items_Detail.rich_text)
          ? props.Items_Detail.rich_text[0]?.plain_text || ""
          : "",
      store7_11:
        props["7-11取貨店號"]?.type === "rich_text" && Array.isArray(props["7-11取貨店號"].rich_text)
          ? props["7-11取貨店號"].rich_text[0]?.plain_text || ""
          : "",
    };
  } catch (error) {
    console.error(`[api/admin/generate-emails] 查詢訂單 ${orderId} 失敗:`, error);
    return null;
  }
}

async function savePendingEmail(
  orderId: string,
  customerName: string,
  customerEmail: string,
  subject: string,
  body: string,
  templateType: string
) {
  try {
    await notion.pages.create({
      parent: { database_id: PENDING_EMAILS_DB_ID! },
      properties: {
        Order_ID: {
          title: [
            {
              text: { content: orderId },
            },
          ],
        },
        Customer_Name: {
          rich_text: [
            {
              text: { content: customerName },
            },
          ],
        },
        Customer_Email: {
          email: customerEmail,
        },
        Email_Subject: {
          rich_text: [
            {
              text: { content: subject },
            },
          ],
        },
        Email_Body: {
          rich_text: [
            {
              text: { content: body },
            },
          ],
        },
        Template_Type: {
          select: { name: templateType },
        },
        Status: {
          select: { name: "pending" },
        },
      },
    });

    return true;
  } catch (error) {
    console.error(
      `[api/admin/generate-emails] 保存待發送郵件失敗 (${orderId}):`,
      error instanceof Error ? error.message : JSON.stringify(error)
    );
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!PENDING_EMAILS_DB_ID) {
    return NextResponse.json(
      { error: "待發送郵件資料庫未配置" },
      { status: 500 }
    );
  }

  try {
    const body: GenerateEmailsRequest = await request.json();
    const {
      orderIds,
      templateType,
      batchName = "首團限定 - Lamer 經典乳霜",
      paymentDeadline = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toLocaleDateString("zh-TW"),
      estimatedShipDate = new Date(
        Date.now() + 20 * 24 * 60 * 60 * 1000
      ).toLocaleDateString("zh-TW"),
    } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "請提供至少一個訂單 ID" },
        { status: 400 }
      );
    }

    if (!["payment", "shipment"].includes(templateType)) {
      return NextResponse.json(
        { error: "無效的模板類型，應為 'payment' 或 'shipment'" },
        { status: 400 }
      );
    }

    const template = DEFAULT_TEMPLATES[templateType];
    if (!template) {
      return NextResponse.json(
        { error: `模板 ${templateType} 不存在` },
        { status: 400 }
      );
    }

    const results: Array<{
      orderId: string;
      status: "success" | "failed";
      message?: string;
    }> = [];

    for (const orderId of orderIds) {
      try {
        const orderData = await getOrderData(orderId);
        if (!orderData) {
          results.push({
            orderId,
            status: "failed",
            message: "訂單不存在或無法讀取",
          });
          continue;
        }

        const emailData = {
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          batchName,
          totalPrice: Number(orderData.totalPrice),
          paymentDeadline,
          estimatedShipDate,
          itemsDetail: orderData.itemsDetail,
          store7_11: orderData.store7_11,
          bankName: BANK_INFO.bankName,
          bankAccount: BANK_INFO.account,
        };

        const subject = renderTemplate(template.subject, emailData);
        const body = renderTemplate(template.body, emailData);

        const saved = await savePendingEmail(
          orderId,
          orderData.customerName,
          orderData.customerEmail,
          subject,
          body,
          templateType
        );

        if (saved) {
          results.push({
            orderId,
            status: "success",
            message: "已生成郵件並存入 Notion",
          });

          console.log(
            `[api/admin/generate-emails] 郵件已生成 - 訂單: ${orderId}`
          );
        } else {
          results.push({
            orderId,
            status: "failed",
            message: "保存到 Notion 失敗",
          });
        }
      } catch (error) {
        results.push({
          orderId,
          status: "failed",
          message: error instanceof Error ? error.message : "未知錯誤",
        });

        console.error(
          `[api/admin/generate-emails] 處理訂單 ${orderId} 失敗:`,
          error
        );
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return NextResponse.json(
      {
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          failed: failedCount,
        },
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/admin/generate-emails] 處理請求失敗:", error);
    return NextResponse.json(
      { error: "處理請求失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
