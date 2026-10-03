import { NextRequest, NextResponse } from "next/server";
import { notion, MEMBERS_DB_ID } from "@/lib/notion";
import { generateReferralCode, recordMarketingOptIn } from "@/lib/referral";

export const dynamic = "force-dynamic";

// 計算待實現分潤：已確認的訂單但未滿 8 天交付期限
async function calculateUnrealizedCommission(referralCode: string): Promise<number> {
  const ORDERS_DB_ID = process.env.NOTION_ORDERS_DB_ID;
  if (!ORDERS_DB_ID || !referralCode) return 0;

  // 設置 5 秒超時，防止慢查詢阻塞會員資料加載
  const timeoutPromise = new Promise<number>((resolve) => {
    setTimeout(() => {
      console.warn("[api/members/profile] 待實現分潤計算超時，返回 0");
      resolve(0);
    }, 5000);
  });

  const calculationPromise = (async () => {
    try {
      const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      // 查詢使用該推薦碼的所有訂單（同時查主推薦碼和次推薦碼）
      const response = await notion.databases.query({
        database_id: ORDERS_DB_ID,
        filter: {
          or: [
            { property: "推薦碼", rich_text: { equals: referralCode } },
            { property: "推薦碼2", rich_text: { equals: referralCode } },
          ],
        },
      });

      let unrealizedTotal = 0;

      for (const order of response.results) {
        if (!("properties" in order)) continue;

        const props = order.properties;

        // 讀取訂單狀態
        const statusProp = props.訂單狀態;
        const status = statusProp && "select" in statusProp ? (statusProp as any).select?.name : "";

        // 跳過已完成的訂單（分潤已實現）
        if (status === "已完成") continue;

        // 讀取實際出貨日期（出貨日期欄位）
        const shipDateProp = props.出貨日期;
        const shipDateStr = shipDateProp && "date" in shipDateProp ? (shipDateProp as any).date?.start : null;

        if (!shipDateStr) continue;

        // 計算出貨日 + 8 天的時間戳
        const shipDate = new Date(shipDateStr).getTime();
        const deadlineTime = shipDate + eightDaysMs;

        // 只計算未達期限的訂單的分潤
        if (now < deadlineTime) {
          // 判斷該推薦碼是主推薦人還是次推薦人，找到對應的分潤金額
          const primaryCode = props.推薦碼 && "rich_text" in props.推薦碼 ? props.推薦碼.rich_text[0]?.plain_text : "";
          const secondaryCode = props.推薦碼2 && "rich_text" in props.推薦碼2 ? props.推薦碼2.rich_text[0]?.plain_text : "";

          if (primaryCode === referralCode) {
            const commissionProp = props.分潤;
            if (commissionProp && "number" in commissionProp && typeof commissionProp.number === "number") {
              unrealizedTotal += commissionProp.number || 0;
            }
          } else if (secondaryCode === referralCode) {
            const commissionProp = props.分潤2;
            if (commissionProp && "number" in commissionProp && typeof commissionProp.number === "number") {
              unrealizedTotal += commissionProp.number || 0;
            }
          }
        }
      }

      return unrealizedTotal;
    } catch (error) {
      console.error("[api/members/profile] 計算待實現分潤失敗:", error);
      return 0;
    }
  })();

  // 返回先完成的結果（超時或計算完成）
  return Promise.race([calculationPromise, timeoutPromise]);
}

type MemberData = {
  email: string;
  birthday?: string; // YYYY-MM-DD
  bankCode?: string;
  bankAccount?: string;
  store711Code?: string;
  recipientName?: string;
  contactPhone?: string;
  agreedToTerms?: boolean;
  marketingOptIn?: boolean;
  unrealizedCommission?: number; // 待實現分潤：已確認但未達條件的分潤
};

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "需要提供 email 參數" },
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
    const queryResponse = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: "Email",
        title: { equals: email.toLowerCase() },
      },
    });

    if (queryResponse.results.length === 0) {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }

    const memberPage = queryResponse.results[0];
    let memberData: any = {
      exists: true,
      email,
      profileComplete: false,
    };

    if ("properties" in memberPage) {
      const props = memberPage.properties;

      // 檢查必填字段（只需要生日）
      memberData.profileComplete = !!(props.生日);

      if (props.生日 && "date" in props.生日) {
        memberData.birthday = (props.生日 as any).date?.start || null;
      }

      if (props.銀行代碼 && "rich_text" in props.銀行代碼) {
        memberData.bankCode = (props.銀行代碼 as any).rich_text?.[0]?.plain_text || null;
      }

      if (props.銀行帳號 && "rich_text" in props.銀行帳號) {
        memberData.bankAccount = (props.銀行帳號 as any).rich_text?.[0]?.plain_text || null;
      }

      if (props.會員等級 && "select" in props.會員等級) {
        memberData.membershipLevel = (props.會員等級 as any).select?.name || "銅級";
      }

      if (props.一年內累計消費金額 && "number" in props.一年內累計消費金額) {
        memberData.totalSpending = (props.一年內累計消費金額 as any).number || 0;
      }

      if (props.歷史累積分潤 && "number" in props.歷史累積分潤) {
        memberData.totalCommission = (props.歷史累積分潤 as any).number || 0;
      }

      if (props.待實現分潤 && "number" in props.待實現分潤) {
        memberData.unrealizedCommissionStored = (props.待實現分潤 as any).number || 0;
      }

      if (props.待提現分潤 && "number" in props.待提現分潤) {
        memberData.availableCommission = (props.待提現分潤 as any).number || 0;
      }

      if (props.撥款處理中 && "number" in props.撥款處理中) {
        memberData.pendingCommission = (props.撥款處理中 as any).number || 0;
      }

      if (props.預設711超商店號 && "rich_text" in props.預設711超商店號) {
        memberData.store711Code = (props.預設711超商店號 as any).rich_text?.[0]?.plain_text || null;
      }

      if (props.收件姓名 && "rich_text" in props.收件姓名) {
        memberData.recipientName = (props.收件姓名 as any).rich_text?.[0]?.plain_text || null;
      }

      if (props.聯絡電話 && "rich_text" in props.聯絡電話) {
        memberData.contactPhone = (props.聯絡電話 as any).rich_text?.[0]?.plain_text || null;
      }

      if (props.條款同意時間 && "date" in props.條款同意時間) {
        memberData.agreedToTerms = !!((props.條款同意時間 as any).date?.start);
      }

      if (props.行銷訂閱 && "checkbox" in props.行銷訂閱) {
        memberData.marketingOptIn = !!(props.行銷訂閱 as any).checkbox;
      }

      // 計算待實現分潤
      if (props.推薦碼 && "rich_text" in props.推薦碼) {
        const referralCode = (props.推薦碼 as any).rich_text?.[0]?.plain_text;
        if (referralCode) {
          memberData.unrealizedCommission = await calculateUnrealizedCommission(referralCode);
        }
      }
    }

    return NextResponse.json(memberData, { status: 200 });
  } catch (error) {
    console.error("[api/members/profile GET]:", error);
    return NextResponse.json(
      { error: "無法查詢會員資料" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: MemberData;

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
    // 查詢會員是否已存在
    const queryResponse = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: "Email",
        title: { equals: email.toLowerCase() },
      },
    });

    const properties: Record<string, any> = {};

    if (body.birthday) {
      properties.生日 = { date: { start: body.birthday } };
    }

    if (body.bankCode) {
      properties.銀行代碼 = {
        rich_text: [{ text: { content: body.bankCode } }],
      };
    }

    if (body.bankAccount) {
      properties.銀行帳號 = {
        rich_text: [{ text: { content: body.bankAccount } }],
      };
    }

    if (body.store711Code) {
      properties.預設711超商店號 = {
        rich_text: [{ text: { content: body.store711Code } }],
      };
    }

    if (body.recipientName) {
      properties.收件姓名 = {
        rich_text: [{ text: { content: body.recipientName } }],
      };
    }

    if (body.contactPhone) {
      properties.聯絡電話 = {
        rich_text: [{ text: { content: body.contactPhone } }],
      };
    }

    if (body.agreedToTerms) {
      properties.條款同意時間 = {
        date: { start: new Date().toISOString() },
      };
    }

    if (queryResponse.results.length > 0) {
      // 更新現有會員
      const memberId = queryResponse.results[0].id;
      await notion.pages.update({
        page_id: memberId,
        properties,
      });
    } else {
      // 建立新會員（預設銅級、消費金額 0）。推薦碼與建立日期一定要在這裡就寫入，
      // 否則之後 /api/referral/generate 只會讀取既有推薦碼、不會補建，導致推薦連結變成 ?ref=null
      properties.Email = {
        title: [{ text: { content: email } }],
      };
      properties.推薦碼 = {
        rich_text: [{ text: { content: generateReferralCode(email) } }],
      };
      properties.會員建立日期 = {
        date: { start: new Date().toISOString().split("T")[0] },
      };
      properties.會員等級 = {
        select: { name: "銅級" },
      };
      properties.一年內累計消費金額 = {
        number: 0,
      };
      properties.歷史累積分潤 = {
        number: 0,
      };
      properties.待實現分潤 = {
        number: 0,
      };
      properties.待提現分潤 = {
        number: 0,
      };
      properties.撥款處理中 = {
        number: 0,
      };

      await notion.pages.create({
        parent: { database_id: MEMBERS_DB_ID },
        properties,
      });
    }

    // 只在會員主動勾選時寫入；未勾選不覆蓋既有的訂閱狀態
    if (body.marketingOptIn) {
      await recordMarketingOptIn(email);
    }

    return NextResponse.json(
      {
        success: true,
        email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/members/profile POST]:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `無法保存會員資料（${detail}）` },
      { status: 500 }
    );
  }
}
