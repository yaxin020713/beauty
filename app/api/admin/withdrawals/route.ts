import { NextRequest, NextResponse } from "next/server";
import { notion, WITHDRAWALS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!WITHDRAWALS_DB_ID) {
    return NextResponse.json(
      { error: "系統配置不完整" },
      { status: 500 }
    );
  }

  try {
    const response = await notion.databases.query({
      database_id: WITHDRAWALS_DB_ID,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    const withdrawals = response.results
      .map((page) => {
        if (!("properties" in page)) return null;
        const props = page.properties;

        const email =
          props["會員Email"]?.type === "title" && Array.isArray(props["會員Email"].title)
            ? props["會員Email"].title[0]?.plain_text || ""
            : "";
        const requestDate =
          props["申請日期"]?.type === "date" && props["申請日期"].date
            ? props["申請日期"].date.start || ""
            : "";
        const amount =
          props["提現金額"]?.type === "number" ? props["提現金額"].number || 0 : 0;
        const fee =
          props["手續費"]?.type === "number" ? props["手續費"].number || 0 : 0;
        const payoutAmount =
          props["實際撥款金額"]?.type === "number" ? props["實際撥款金額"].number || 0 : 0;
        const bankCode =
          props["銀行代碼"]?.type === "rich_text" && Array.isArray(props["銀行代碼"].rich_text)
            ? props["銀行代碼"].rich_text[0]?.plain_text || ""
            : "";
        const bankAccount =
          props["銀行帳號"]?.type === "rich_text" && Array.isArray(props["銀行帳號"].rich_text)
            ? props["銀行帳號"].rich_text[0]?.plain_text || ""
            : "";
        const status =
          props["狀態"]?.type === "select" && props["狀態"].select
            ? (props["狀態"].select as any).name || ""
            : "";
        const note =
          props["異常備註"]?.type === "rich_text" && Array.isArray(props["異常備註"].rich_text)
            ? props["異常備註"].rich_text[0]?.plain_text || ""
            : "";
        const resolvedDate =
          props["處理日期"]?.type === "date" && props["處理日期"].date
            ? props["處理日期"].date.start || ""
            : "";

        return {
          id: page.id,
          email,
          requestDate,
          amount,
          fee,
          payoutAmount,
          bankCode,
          bankAccount,
          status,
          note,
          resolvedDate,
        };
      })
      .filter((w): w is NonNullable<typeof w> => w !== null);

    return NextResponse.json({ success: true, withdrawals });
  } catch (error) {
    console.error("[api/admin/withdrawals] 獲取提現紀錄失敗:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `獲取提現紀錄失敗（${detail}）` },
      { status: 500 }
    );
  }
}
