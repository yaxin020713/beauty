import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID, BATCHES_DB_ID } from "@/lib/notion";
import { DEFAULT_TEMPLATES, generateNotificationEmail } from "@/lib/notification-templates";
import { generateCSV, generateDownloadBlob, generateFileName } from "@/lib/excel-export";

interface OrderData {
  id: string;
  customerName: string;
  customerEmail: string;
  totalPrice: number;
}

interface BatchInfo {
  id: string;
  name: string;
  paymentDeadline: string;
  estimatedShipDate: string;
}

/**
 * 從 Notion 獲取批次信息
 */
async function getBatchInfo(batchId: string): Promise<BatchInfo | null> {
  try {
    const batchesQuery = await notion.databases.query({
      database_id: BATCHES_DB_ID,
      filter: {
        property: "Batch_ID",
        title: { equals: batchId },
      },
      page_size: 1,
    });

    if (batchesQuery.results.length === 0) return null;

    const batchPage = batchesQuery.results[0];
    if (!("properties" in batchPage)) return null;

    const props = batchPage.properties as Record<string, any>;

    const name = props.Batch_Name?.rich_text?.[0]?.plain_text || batchId;
    const paymentDeadline = props.Payment_Deadline?.date?.start || "";
    const estimatedShipDate = props.Estimated_Ship_Date?.date?.start || "";

    if (!paymentDeadline || !estimatedShipDate) {
      console.warn(`[notifications/export] 批次 ${batchId} 缺少必要日期信息`);
      return null;
    }

    // 轉換日期格式為台灣本地格式
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString("zh-TW");
    };

    return {
      id: batchPage.id,
      name,
      paymentDeadline: formatDate(paymentDeadline),
      estimatedShipDate: formatDate(estimatedShipDate),
    };
  } catch (error) {
    console.error("[notifications/export] 查詢批次信息失敗:", error);
    return null;
  }
}

/**
 * 獲取批次的所有訂單
 * 透過 Batch_ID 關聯字段查詢 Orders 表
 */
async function getOrdersForBatch(batchPageId: string): Promise<OrderData[]> {
  try {
    // 使用 Notion API 查詢關聯
    // 直接透過 Batch_ID 欄位查詢 Orders 表，其中 Batch_ID 包含該批次 ID
    const ordersQuery = await notion.databases.query({
      database_id: ORDERS_DB_ID,
      filter: {
        property: "Batch_ID",
        relation: {
          contains: batchPageId,
        },
      },
    });

    return ordersQuery.results
      .map((result) => {
        if (!("properties" in result)) return null;
        const props = result.properties as Record<string, any>;

        const customerName =
          props.Customer_Name?.rich_text?.[0]?.plain_text || "顧客";
        const customerEmail =
          props.聯繫用Email?.rich_text?.[0]?.plain_text || "";
        const totalPrice = props.Total_Price?.number || 0;

        if (!customerEmail) return null;

        return {
          id: result.id,
          customerName,
          customerEmail,
          totalPrice,
        };
      })
      .filter(Boolean) as OrderData[];
  } catch (error) {
    console.error("[notifications/export] 查詢訂單失敗:", error);
    return [];
  }
}

/**
 * 批次 API - 生成通知郵件清單並導出 CSV
 * GET /api/admin/batches/[batchId]/notifications/export?type=payment|shipment
 *
 * 查詢參數：
 * - type: "payment" 或 "shipment"（必填）
 * - format: "preview" 或 "download"（可選，預設 "download"）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const batchId = params.batchId;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as "payment" | "shipment";
    const format = searchParams.get("format") || "download";

    // 驗證參數
    if (!type || !["payment", "shipment"].includes(type)) {
      return NextResponse.json(
        { error: "type 參數必填，值為 'payment' 或 'shipment'" },
        { status: 400 }
      );
    }

    // 驗證 BATCHES_DB_ID 是否設置
    if (!BATCHES_DB_ID) {
      return NextResponse.json(
        { error: "未設置 NOTION_BATCHES_DB_ID，請在 .env.local 中添加" },
        { status: 500 }
      );
    }

    // 從 Notion 取得批次資訊
    const batchInfo = await getBatchInfo(batchId);
    if (!batchInfo) {
      return NextResponse.json(
        { error: `找不到批次 ID: ${batchId}。請確認批次名稱正確` },
        { status: 404 }
      );
    }

    // 獲取該批次的所有訂單
    const orders = await getOrdersForBatch(batchInfo.id);

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "此批次沒有訂單" },
        { status: 404 }
      );
    }

    // 獲取對應的模板
    const template = DEFAULT_TEMPLATES[type];
    if (!template || !template.enabled) {
      return NextResponse.json(
        { error: `${type} 模板未啟用` },
        { status: 400 }
      );
    }

    // 為每個訂單生成通知郵件
    const notifications = orders.map((order) =>
      generateNotificationEmail(template, {
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        batchName: batchInfo.name,
        totalPrice: order.totalPrice,
        paymentDeadline: batchInfo.paymentDeadline,
        estimatedShipDate: batchInfo.estimatedShipDate,
      })
    );

    // 根據格式要求返回
    if (format === "preview") {
      // 預覽模式：返回 JSON 格式的前 5 筆
      return NextResponse.json({
        total: notifications.length,
        preview: notifications.slice(0, 5),
      });
    } else {
      // 下載模式：返回 CSV 文件
      const csv = generateCSV(notifications);
      const blob = generateDownloadBlob(csv);
      const fileName = generateFileName(batchInfo.name, type);

      return new NextResponse(blob, {
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            fileName
          )}"`,
        },
      });
    }
  } catch (error) {
    console.error("[notifications/export] 處理失敗:", error);
    return NextResponse.json(
      { error: "生成通知清單失敗" },
      { status: 500 }
    );
  }
}
