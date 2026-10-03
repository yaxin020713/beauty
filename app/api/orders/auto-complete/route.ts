import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID } from "@/lib/notion";
import { moveUnrealizedCommissionToAvailable } from "@/lib/referral";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5分鐘超時

export async function POST(request: NextRequest) {
  // 驗證請求來自信任的來源（可選，建議加上 API Key 驗證）
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.CRON_SECRET;

  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  if (!ORDERS_DB_ID) {
    return NextResponse.json(
      { error: "系統配置不完整" },
      { status: 500 }
    );
  }

  try {
    const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // 查詢所有非「已完成」的訂單
    const response = await notion.databases.query({
      database_id: ORDERS_DB_ID,
      filter: {
        property: "訂單狀態",
        select: {
          does_not_equal: "已完成",
        },
      },
    });

    let completedCount = 0;
    const errors: string[] = [];

    for (const page of response.results) {
      if (!("properties" in page)) continue;

      const props = page.properties;

      // 讀取訂單狀態
      const statusProp = props.訂單狀態;
      const status = statusProp && "select" in statusProp ? (statusProp as any).select?.name : "";

      // 跳過已經是「已完成」的訂單
      if (status === "已完成") continue;

      // 讀取出貨日期
      const shipDateProp = props.出貨日期;
      const shipDateStr = shipDateProp && "date" in shipDateProp ? (shipDateProp as any).date?.start : null;

      if (!shipDateStr) continue;

      // 計算是否達到 8 天期限
      const shipDate = new Date(shipDateStr).getTime();
      const deadlineTime = shipDate + eightDaysMs;

      if (now >= deadlineTime) {
        // 達到期限，更新狀態為「已完成」，並將待實現分潤轉到待提現分潤
        try {
          await notion.pages.update({
            page_id: page.id,
            properties: {
              訂單狀態: { select: { name: "已完成" } },
            },
          });

          // 將推薦人的待實現分潤轉到待提現分潤
          const primaryEmail = props.推薦人信箱 && "rich_text" in props.推薦人信箱 ? props.推薦人信箱.rich_text[0]?.plain_text : "";
          const primaryCommission = props.分潤 && "number" in props.分潤 ? props.分潤.number || 0 : 0;
          const secondaryEmail = props.推薦人信箱2 && "rich_text" in props.推薦人信箱2 ? props.推薦人信箱2.rich_text[0]?.plain_text : "";
          const secondaryCommission = props.分潤2 && "number" in props.分潤2 ? props.分潤2.number || 0 : 0;

          // 轉移推薦人分潤：同時轉移主推薦人與次推薦人（如果存在）
          if (primaryEmail && primaryCommission > 0) {
            await moveUnrealizedCommissionToAvailable(primaryEmail, primaryCommission);
          }
          if (secondaryEmail && secondaryCommission > 0) {
            await moveUnrealizedCommissionToAvailable(secondaryEmail, secondaryCommission);
          }

          completedCount++;
        } catch (err) {
          const orderId = props.Order_ID?.title?.[0]?.plain_text || page.id;
          errors.push(`訂單 ${orderId}: ${err instanceof Error ? err.message : "未知錯誤"}`);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `已處理 ${response.results.length} 筆訂單，自動完成 ${completedCount} 筆`,
        completed: completedCount,
        total: response.results.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/orders/auto-complete] 自動完成訂單失敗:", error);
    return NextResponse.json(
      { error: "自動完成訂單失敗", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
