import { NextRequest, NextResponse } from "next/server";
import { notion, WITHDRAWALS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "需要提供 email 參數" }, { status: 400 });
  }

  if (!WITHDRAWALS_DB_ID) {
    return NextResponse.json({ error: "系統配置不完整" }, { status: 500 });
  }

  try {
    const response = await notion.databases.query({
      database_id: WITHDRAWALS_DB_ID,
      filter: {
        property: "會員Email",
        title: { equals: email },
      },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    const records = response.results
      .map((page) => {
        if (!("properties" in page)) return null;
        const props = page.properties;

        const requestDate =
          props["申請日期"]?.type === "date" && props["申請日期"].date
            ? props["申請日期"].date.start || ""
            : "";
        const payoutAmount =
          props["實際撥款金額"]?.type === "number" ? props["實際撥款金額"].number || 0 : 0;
        const status =
          props["狀態"]?.type === "select" && props["狀態"].select
            ? (props["狀態"].select as any).name || ""
            : "";
        const note =
          props["異常備註"]?.type === "rich_text" && Array.isArray(props["異常備註"].rich_text)
            ? props["異常備註"].rich_text[0]?.plain_text || ""
            : "";

        return { requestDate, payoutAmount, status, note };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error("[api/members/withdrawal-history]:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `無法查詢提現紀錄（${detail}）` },
      { status: 500 }
    );
  }
}
