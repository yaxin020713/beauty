import { NextRequest, NextResponse } from "next/server";
import { notion, MEMBERS_DB_ID } from "@/lib/notion";
import { generateReferralCode } from "@/lib/referral";

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
    // 查詢會員是否已存在
    const queryResponse = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: "email",
        email: {
          equals: email,
        },
      },
    });

    let memberId: string | null = null;
    let referralCode: string | null = null;

    if (queryResponse.results.length > 0) {
      // 會員已存在，取得推薦碼
      const memberPage = queryResponse.results[0];
      memberId = memberPage.id;

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

      const newMemberPage = await notion.pages.create({
        parent: { database_id: MEMBERS_DB_ID },
        properties: {
          email: {
            email: email,
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
          會員創建日期: {
            date: {
              start: new Date().toISOString().split("T")[0],
            },
          },
        },
      });

      memberId = newMemberPage.id;
    }

    // 獲取累積返利
    let totalReward = 0;
    const memberResponse = await notion.pages.retrieve({ page_id: memberId! });
    if ("properties" in memberResponse) {
      const rewardProp = memberResponse.properties.累積返利;
      if (rewardProp && "number" in rewardProp && typeof rewardProp.number === "number") {
        totalReward = rewardProp.number;
      }
    }

    return NextResponse.json(
      {
        success: true,
        email,
        referralCode,
        totalReward,
        referralLink: `${process.env.NEXT_PUBLIC_SITE_URL || "https://beauty.site"}?ref=${referralCode}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/referral/generate]:", error);
    return NextResponse.json(
      { error: "生成推薦碼失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
