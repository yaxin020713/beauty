import { NextRequest, NextResponse } from "next/server";
import { notion, MEMBERS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

const WITHDRAW_COOLDOWN_DAYS = 30;
const MIN_WITHDRAW_AMOUNT = 500;

export async function POST(request: NextRequest) {
  let body: { email?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json(
      { error: "需要提供 email" },
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
    let lastWithdrawDate: string | null = null;

    if ("properties" in memberPage) {
      const availableProp = memberPage.properties.尚未提現分潤;
      const pendingProp = memberPage.properties.處理中分潤;
      const lastWithdrawProp = memberPage.properties.最近提現日期;

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

      if (lastWithdrawProp && "date" in lastWithdrawProp && lastWithdrawProp.date) {
        lastWithdrawDate = lastWithdrawProp.date.start;
      }
    }

    // 30 天內只能申請一次提現
    if (lastWithdrawDate) {
      const nextEligibleDate = new Date(`${lastWithdrawDate}T00:00:00+08:00`);
      nextEligibleDate.setDate(nextEligibleDate.getDate() + WITHDRAW_COOLDOWN_DAYS);

      if (Date.now() < nextEligibleDate.getTime()) {
        const nextEligibleStr = nextEligibleDate.toLocaleDateString("sv-SE", {
          timeZone: "Asia/Taipei",
        });
        return NextResponse.json(
          { error: `每 ${WITHDRAW_COOLDOWN_DAYS} 天只能申請一次提現，最快可於 ${nextEligibleStr} 再次申請` },
          { status: 400 }
        );
      }
    }

    // 提現一律將目前全部「尚未提現分潤」一次提出，且需達最低門檻
    const amount = currentAvailable;
    if (amount < MIN_WITHDRAW_AMOUNT) {
      return NextResponse.json(
        { error: `分潤不足。目前有 NT$${currentAvailable} 可提現，需達 NT$${MIN_WITHDRAW_AMOUNT} 以上` },
        { status: 400 }
      );
    }

    // 更新會員資料：清空尚未提現分潤，增加處理中分潤（撥款處理中），並記錄本次提現日期；
    // 累積分潤是終身總額，不受提現影響
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });
    await notion.pages.update({
      page_id: memberPage.id,
      properties: {
        尚未提現分潤: { number: currentAvailable - amount },
        處理中分潤: { number: currentPendingWithdraw + amount },
        最近提現日期: { date: { start: today } },
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
