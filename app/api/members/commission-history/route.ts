import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID, MEMBERS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

type CommissionRecord = {
  orderId: string;
  date: string;
  totalPrice: number;
  commission: number;
  itemsDetail: string;
  status: string;
  credited: boolean;
  note: string;
};

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "需要提供 email 參數" },
      { status: 400 }
    );
  }

  if (!ORDERS_DB_ID) {
    return NextResponse.json(
      { error: "系統配置不完整" },
      { status: 500 }
    );
  }

  try {
    const normalizedEmail = email.toLowerCase();

    // 查詢該用戶作為推薦人的所有訂單（一筆訂單同時使用推薦連結與手動輸入推薦碼、
    // 分屬不同人時，該用戶可能是第一或第二推薦人，見 推薦人信箱 / 推薦人信箱2）
    const queryResponse = await notion.databases.query({
      database_id: ORDERS_DB_ID,
      filter: {
        or: [
          { property: "推薦人信箱", rich_text: { equals: normalizedEmail } },
          { property: "推薦人信箱2", rich_text: { equals: normalizedEmail } },
        ],
      },
    });

    const records: CommissionRecord[] = [];

    for (const page of queryResponse.results) {
      if (!("properties" in page)) continue;

      const props = page.properties;

      // 提取訂單 ID
      const orderIdProp = props.Order_ID;
      let orderId = "";
      if (
        orderIdProp &&
        "title" in orderIdProp &&
        Array.isArray(orderIdProp.title) &&
        orderIdProp.title.length > 0
      ) {
        orderId = orderIdProp.title[0].plain_text;
      }

      // 訂單建立時間（訂單建立時並未寫入獨立的日期欄位，改用 Notion 頁面的建立時間）
      const orderDate = (page as any).created_time || "";

      // 訂單狀態：用來標示這筆分潤是否已經實際入帳給推薦人
      // （分潤僅在訂單轉為「已完成」時才會計入累積分潤，見 applyReferralCommission）
      const statusProp = props["訂單狀態"];
      const status =
        statusProp?.type === "select" && statusProp.select
          ? (statusProp.select as any).name || ""
          : "";

      // 提取結帳金額
      const priceProp = props.Total_Price;
      let totalPrice = 0;
      if (priceProp && "number" in priceProp && typeof priceProp.number === "number") {
        totalPrice = priceProp.number;
      }

      // 判斷目前這位推薦人是訂單上的第一位還是第二位推薦人，取對應的分潤欄位
      const referrer1Email =
        props["推薦人信箱"]?.type === "rich_text" && Array.isArray(props["推薦人信箱"].rich_text)
          ? props["推薦人信箱"].rich_text[0]?.plain_text || ""
          : "";
      const isSecondReferrer = referrer1Email.toLowerCase() !== normalizedEmail;

      const commissionProp = isSecondReferrer ? props.分潤2 : props.分潤;
      let commission = 0;
      if (
        commissionProp &&
        "number" in commissionProp &&
        typeof commissionProp.number === "number"
      ) {
        commission = commissionProp.number;
      }

      // 若訂單同時使用了推薦連結與手動輸入推薦碼（分屬不同人），附上說明
      const noteProp = props.分潤備註;
      const note =
        noteProp && "rich_text" in noteProp && Array.isArray(noteProp.rich_text) && noteProp.rich_text.length > 0
          ? noteProp.rich_text[0].plain_text
          : "";

      // 提取商品明細
      const itemsProp = props.Items_Detail;
      let itemsDetail = "";
      if (
        itemsProp &&
        "rich_text" in itemsProp &&
        Array.isArray(itemsProp.rich_text) &&
        itemsProp.rich_text.length > 0
      ) {
        itemsDetail = itemsProp.rich_text[0].plain_text;
      }

      if (commission > 0) {
        records.push({
          orderId,
          date: orderDate,
          totalPrice,
          commission,
          itemsDetail: itemsDetail.split("\n")[0], // 只取第一行（商品部分）
          status,
          credited: status === "已完成",
          note,
        });
      }
    }

    // 按日期排序（最新的在前）
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(
      {
        success: true,
        email,
        records,
        total: records.reduce((sum, r) => sum + r.commission, 0),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/members/commission-history]:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `無法查詢分潤明細（${detail}）` },
      { status: 500 }
    );
  }
}
