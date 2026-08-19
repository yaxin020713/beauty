import { NextRequest, NextResponse } from "next/server";
import { notion, MEMBERS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { email?: string; amount?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();
  const amount = body.amount || 0;

  if (!email) {
    return NextResponse.json(
      { error: "需要提供 email" },
      { status: 400 }
    );
  }

  if (amount < 500) {
    return NextResponse.json(
      { error: "提現金額必須達 NT$500 以上" },
      { status: 400 }
    );
  }

  if (!MEMBERS_DB_ID) {
    return NextResponse.json(
      { error: "系統配置不完整" },
      { status: 500 }
    );
  }

  try {
    // 查詢會員
    const queryResponse = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: "Email",
        title: { equals: email },
      },
    });

    if (queryResponse.results.length === 0) {
      return NextResponse.json(
        { error: "會員不存在" },
        { status: 404 }
      );
    }

    const memberPage = queryResponse.results[0];
    let currentAvailable = 0;
    let currentPendingWithdraw = 0;

    if ("properties" in memberPage) {
      const availableProp = memberPage.properties.尚未提現分潤;
      const pendingProp = memberPage.properties.處理中分潤;

      if (
        availableProp &&
        "number" in availableProp &&
        typeof availableProp.number === "number"
      ) {
        currentAvailable = availableProp.number || 0;
      }

      if (
        pendingProp &&
        "number" in pendingProp &&
        typeof pendingProp.number === "number"
      ) {
        currentPendingWithdraw = pendingProp.number || 0;
      }
    }

    // 檢查是否有足夠的分潤可提現
    if (currentAvailable < amount) {
      return NextResponse.json(
        { error: `分潤不足。目前有 NT$${currentAvailable} 可提現` },
        { status: 400 }
      );
    }

    // 更新會員資料：減少尚未提現分潤，增加處理中分潤（撥款處理中）；累積分潤是終身總額，不受提現影響
    await notion.pages.update({
      page_id: memberPage.id,
      properties: {
        尚未提現分潤: { number: currentAvailable - amount },
        處理中分潤: { number: currentPendingWithdraw + amount },
      },
    });

    return NextResponse.json(
      {
        success: true,
        email,
        amount,
        message: `成功提現 NT$${amount}，將於 1-3 個工作天內匯入您的帳戶`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/members/withdraw]:", error);
    return NextResponse.json(
      { error: "提現失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
