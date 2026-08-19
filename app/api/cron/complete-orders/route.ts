import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID } from "@/lib/notion";
import { applyReferralCommission } from "@/lib/referral";

export const dynamic = "force-dynamic";

const COMPLETION_DAYS = 8;

// 出貨日期（台灣時區 UTC+8 當天 00:00）滿 8 天後即視為可轉為已完成
function isPastCompletionDeadline(shippingDateStr: string): boolean {
  const shipDate = new Date(`${shippingDateStr}T00:00:00+08:00`);
  if (Number.isNaN(shipDate.getTime())) return false;
  const deadline = shipDate.getTime() + COMPLETION_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() >= deadline;
}

// 由 Vercel Cron 每日觸發：將出貨滿 8 天的訂單自動轉為「已完成」
// 「異常中」訂單一律跳過，只能由管理員在面板手動變更狀態
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }
  }

  try {
    let updatedCount = 0;
    let skippedCount = 0;
    let cursor: string | undefined = undefined;

    do {
      const response = await notion.databases.query({
        database_id: ORDERS_DB_ID,
        start_cursor: cursor,
        filter: {
          property: "訂單狀態",
          select: { equals: "已出貨" },
        },
      });

      for (const page of response.results) {
        if (!("properties" in page)) continue;

        const props = page.properties;
        const shippingDate =
          props["出貨日期"]?.type === "date" && props["出貨日期"].date
            ? props["出貨日期"].date.start
            : null;

        if (!shippingDate || !isPastCompletionDeadline(shippingDate)) {
          skippedCount++;
          continue;
        }

        await notion.pages.update({
          page_id: page.id,
          properties: {
            "訂單狀態": { select: { name: "已完成" } },
          },
        });

        try {
          await applyReferralCommission(page);
        } catch (err) {
          console.error(`[api/cron/complete-orders] 訂單 ${page.id} 分潤入帳失敗:`, err);
        }

        updatedCount++;
      }

      cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (cursor);

    return NextResponse.json({
      success: true,
      updatedCount,
      skippedCount,
    });
  } catch (error) {
    console.error("[api/cron/complete-orders] 自動完成訂單失敗:", error);
    return NextResponse.json(
      { error: "自動完成訂單失敗" },
      { status: 500 }
    );
  }
}
