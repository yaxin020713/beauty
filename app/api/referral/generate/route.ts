import { NextRequest, NextResponse } from "next/server";
import { notion, MEMBERS_DB_ID } from "@/lib/notion";
import { generateReferralCode, getSiteUrlFromRequest } from "@/lib/referral";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { email?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "請提供有效的 Email" },
      { status: 400 }
    );
  }

  if (!MEMBERS_DB_ID) {
    return NextResponse.json(
      { error: "系統配置不完整，推薦碼功能未啟用" },
      { status: 500 }
    );
  }

  try {
    console.log("[api/referral/generate] 開始處理 email:", email);
    console.log("[api/referral/generate] MEMBERS_DB_ID:", MEMBERS_DB_ID);

    // 查詢會員是否已存在
    const queryResponse = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: "Email",
        title: {
          equals: email,
        },
      },
    });

    console.log("[api/referral/generate] 查詢結果:", queryResponse.results.length, "個記錄");

    let memberId: string | null = null;
    let referralCode: string | null = null;

    if (queryResponse.results.length > 0) {
      // 會員已存在，取得推薦碼
      const memberPage = queryResponse.results[0];
      memberId = memberPage.id;
      console.log("[api/referral/generate] 會員已存在, ID:", memberId);

      if ("properties" in memberPage) {
        const codeProperty = memberPage.properties.推薦碼;
        if (
          codeProperty &&
          "rich_text" in codeProperty &&
          Array.isArray(codeProperty.rich_text) &&
          codeProperty.rich_text.length > 0
        ) {
          referralCode = codeProperty.rich_text[0].plain_text;
        }
      }
    } else {
      // 新會員：生成推薦碼並建立頁面
      referralCode = generateReferralCode(email);
      console.log("[api/referral/generate] 新會員，生成推薦碼:", referralCode);

      const newMemberPage = await notion.pages.create({
        parent: { database_id: MEMBERS_DB_ID },
        properties: {
          Email: {
            title: [
              {
                text: {
                  content: email,
                },
              },
            ],
          },
          推薦碼: {
            rich_text: [
              {
                text: {
                  content: referralCode,
                },
              },
            ],
          },
          會員建立日期: {
            date: {
              start: new Date().toISOString().split("T")[0],
            },
          },
          會員等級: {
            select: { name: "銅級" },
          },
          一年內累計消費金額: {
            number: 0,
          },
          累積分潤: {
            number: 0,
          },
          尚未提現分潤: {
            number: 0,
          },
          處理中分潤: {
            number: 0,
          },
        },
      });

      memberId = newMemberPage.id;
      console.log("[api/referral/generate] 新會員記錄已建立, ID:", memberId);
    }

    // 獲取完整會員資料（分潤成果、會員等級、銀行資訊等），供 /account 頁面一次顯示
    let totalCommission = 0;
    let availableCommission = 0;
    let pendingCommission = 0;
    let membershipLevel = "銅級";
    let totalSpending = 0;
    let birthday: string | null = null;
    let address: string | null = null;
    let bankCode: string | null = null;
    let bankAccount: string | null = null;
    let store711Code: string | null = null;

    const memberResponse = await notion.pages.retrieve({ page_id: memberId! });
    if ("properties" in memberResponse) {
      const props = memberResponse.properties;

      if (props.累積分潤 && "number" in props.累積分潤) {
        totalCommission = (props.累積分潤 as any).number || 0;
      }
      if (props.尚未提現分潤 && "number" in props.尚未提現分潤) {
        availableCommission = (props.尚未提現分潤 as any).number || 0;
      }
      if (props.處理中分潤 && "number" in props.處理中分潤) {
        pendingCommission = (props.處理中分潤 as any).number || 0;
      }
      if (props.會員等級 && "select" in props.會員等級) {
        membershipLevel = (props.會員等級 as any).select?.name || "銅級";
      }
      if (props.一年內累計消費金額 && "number" in props.一年內累計消費金額) {
        totalSpending = (props.一年內累計消費金額 as any).number || 0;
      }
      if (props.生日 && "date" in props.生日) {
        birthday = (props.生日 as any).date?.start || null;
      }
      if (props.地址 && "rich_text" in props.地址) {
        address = (props.地址 as any).rich_text?.[0]?.plain_text || null;
      }
      if (props.銀行代碼 && "rich_text" in props.銀行代碼) {
        bankCode = (props.銀行代碼 as any).rich_text?.[0]?.plain_text || null;
      }
      if (props.銀行帳號 && "rich_text" in props.銀行帳號) {
        bankAccount = (props.銀行帳號 as any).rich_text?.[0]?.plain_text || null;
      }
      if (props.預設711超商店號 && "rich_text" in props.預設711超商店號) {
        store711Code = (props.預設711超商店號 as any).rich_text?.[0]?.plain_text || null;
      }
    }

    console.log("[api/referral/generate] 分潤金額:", totalCommission);

    const siteUrl = getSiteUrlFromRequest(request);

    return NextResponse.json(
      {
        success: true,
        email,
        referralCode,
        totalCommission,
        availableCommission,
        pendingCommission,
        membershipLevel,
        totalSpending,
        birthday,
        address,
        bankCode,
        bankAccount,
        store711Code,
        referralLink: `${siteUrl}?ref=${referralCode}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/referral/generate] 錯誤:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `生成推薦碼失敗，請稍後再試（${detail}）` },
      { status: 500 }
    );
  }
}
