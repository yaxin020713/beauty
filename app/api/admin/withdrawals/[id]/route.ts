import { NextRequest, NextResponse } from "next/server";
import { notion, MEMBERS_DB_ID, WITHDRAWALS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

const DEFAULT_ABNORMAL_NOTE = "帳號有誤，已發信至您的 Email 聯繫，請確認後回覆";

type UpdateRequest = {
  status?: "已完成" | "異常";
  note?: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!MEMBERS_DB_ID || !WITHDRAWALS_DB_ID) {
    return NextResponse.json(
      { error: "系統配置不完整" },
      { status: 500 }
    );
  }

  let body: UpdateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  if (body.status !== "已完成" && body.status !== "異常") {
    return NextResponse.json(
      { error: "狀態必須是「已完成」或「異常」" },
      { status: 400 }
    );
  }

  const withdrawalId = params.id;

  try {
    const withdrawalPage = await notion.pages.retrieve({ page_id: withdrawalId });
    if (!("properties" in withdrawalPage)) {
      return NextResponse.json({ error: "找不到提現紀錄" }, { status: 404 });
    }

    const props = withdrawalPage.properties;

    const currentStatus =
      props["狀態"]?.type === "select" && props["狀態"].select
        ? (props["狀態"].select as any).name || ""
        : "";
    if (currentStatus !== "處理中") {
      return NextResponse.json(
        { error: "這筆提現已經處理過了" },
        { status: 400 }
      );
    }

    const email =
      props["會員Email"]?.type === "title" && Array.isArray(props["會員Email"].title)
        ? props["會員Email"].title[0]?.plain_text || ""
        : "";
    const amount =
      props["提現金額"]?.type === "number" ? props["提現金額"].number || 0 : 0;
    const payoutAmount =
      props["實際撥款金額"]?.type === "number" ? props["實際撥款金額"].number || 0 : 0;

    if (!email) {
      return NextResponse.json({ error: "提現紀錄缺少會員 Email" }, { status: 400 });
    }

    const memberQuery = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: { property: "Email", title: { equals: email } },
    });

    if (memberQuery.results.length === 0) {
      return NextResponse.json({ error: "找不到對應的會員" }, { status: 404 });
    }

    const memberPage = memberQuery.results[0];
    let currentAvailable = 0;
    let currentPendingWithdraw = 0;
    if ("properties" in memberPage) {
      const availableProp = memberPage.properties.尚未提現分潤;
      const pendingProp = memberPage.properties.處理中分潤;
      if (availableProp && "number" in availableProp && typeof availableProp.number === "number") {
        currentAvailable = availableProp.number || 0;
      }
      if (pendingProp && "number" in pendingProp && typeof pendingProp.number === "number") {
        currentPendingWithdraw = pendingProp.number || 0;
      }
    }

    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });

    if (body.status === "已完成") {
      // 撥款完成：處理中分潤扣除這筆已實際匯出的金額
      await notion.pages.update({
        page_id: memberPage.id,
        properties: {
          處理中分潤: { number: Math.max(0, currentPendingWithdraw - payoutAmount) },
        },
      });

      await notion.pages.update({
        page_id: withdrawalId,
        properties: {
          狀態: { select: { name: "已完成" } },
          處理日期: { date: { start: today } },
        },
      });
    } else {
      // 異常（例如銀行帳號有誤）：整筆金額退回尚未提現分潤，會員需修正資料後重新申請；
      // 同時清除最近提現日期，避免 30 天冷卻期擋住這次的重新申請
      await notion.pages.update({
        page_id: memberPage.id,
        properties: {
          處理中分潤: { number: Math.max(0, currentPendingWithdraw - payoutAmount) },
          尚未提現分潤: { number: currentAvailable + amount },
          最近提現日期: { date: null },
        },
      });

      await notion.pages.update({
        page_id: withdrawalId,
        properties: {
          狀態: { select: { name: "異常" } },
          異常備註: { rich_text: [{ text: { content: body.note?.trim() || DEFAULT_ABNORMAL_NOTE } }] },
          處理日期: { date: { start: today } },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/withdrawals/[id]] 更新提現紀錄失敗:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `更新提現紀錄失敗（${detail}）` },
      { status: 500 }
    );
  }
}
