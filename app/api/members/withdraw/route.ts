import { NextRequest, NextResponse } from "next/server";
import { notion, MEMBERS_DB_ID, WITHDRAWALS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

const WITHDRAW_COOLDOWN_DAYS = 30;
const MIN_WITHDRAW_AMOUNT = 500;
// 非永豐銀行（807）帳戶每次提現收取的手續費
const NON_SINOPAC_WITHDRAW_FEE = 15;
const SINOPAC_BANK_CODE = "807";

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

  if (!MEMBERS_DB_ID || !WITHDRAWALS_DB_ID) {
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
    let bankCode = "";
    let bankAccount = "";

    if ("properties" in memberPage) {
      const availableProp = memberPage.properties.尚未提現分潤;
      const pendingProp = memberPage.properties.處理中分潤;
      const lastWithdrawProp = memberPage.properties.最近提現日期;
      const bankCodeProp = memberPage.properties.銀行代碼;
      const bankAccountProp = memberPage.properties.銀行帳號;

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

      if (
        bankCodeProp &&
        "rich_text" in bankCodeProp &&
        Array.isArray(bankCodeProp.rich_text) &&
        bankCodeProp.rich_text.length > 0
      ) {
        bankCode = bankCodeProp.rich_text[0].plain_text.trim();
      }

      if (
        bankAccountProp &&
        "rich_text" in bankAccountProp &&
        Array.isArray(bankAccountProp.rich_text) &&
        bankAccountProp.rich_text.length > 0
      ) {
        bankAccount = bankAccountProp.rich_text[0].plain_text.trim();
      }
    }

    if (!bankCode || !bankAccount) {
      return NextResponse.json(
        { error: "請先在會員檔案中填寫銀行帳號" },
        { status: 400 }
      );
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

    // 非永豐銀行（807）帳戶每次提現收取手續費，實際撥款金額需扣除手續費
    const fee = bankCode === SINOPAC_BANK_CODE ? 0 : NON_SINOPAC_WITHDRAW_FEE;
    const payoutAmount = amount - fee;
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });

    // 先建立提現紀錄（狀態：處理中），供管理面板追蹤與撥款；
    // 銀行資訊當下拍照存證，避免會員之後改了銀行帳號對不上這筆申請
    await notion.pages.create({
      parent: { database_id: WITHDRAWALS_DB_ID },
      properties: {
        會員Email: { title: [{ text: { content: email } }] },
        申請日期: { date: { start: today } },
        提現金額: { number: amount },
        手續費: { number: fee },
        實際撥款金額: { number: payoutAmount },
        銀行代碼: { rich_text: [{ text: { content: bankCode } }] },
        銀行帳號: { rich_text: [{ text: { content: bankAccount } }] },
        狀態: { select: { name: "處理中" } },
      },
    });

    // 更新會員資料：清空尚未提現分潤（全額），增加處理中分潤（實際撥款金額，已扣手續費），
    // 並記錄本次提現日期；累積分潤是終身總額，不受提現影響
    await notion.pages.update({
      page_id: memberPage.id,
      properties: {
        尚未提現分潤: { number: currentAvailable - amount },
        處理中分潤: { number: currentPendingWithdraw + payoutAmount },
        最近提現日期: { date: { start: today } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        email,
        amount,
        fee,
        payoutAmount,
        message:
          fee > 0
            ? `成功提現 NT$${amount}，非永豐銀行帳戶收取 NT$${fee} 手續費，實際將匯入 NT$${payoutAmount}（1-3 個工作天內）`
            : `成功提現 NT$${amount}，將於 1-3 個工作天內匯入您的帳戶`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/members/withdraw]:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `提現失敗，請稍後再試（${detail}）` },
      { status: 500 }
    );
  }
}
