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
        },
      });

      memberId = newMemberPage.id;
      console.log("[api/referral/generate] 新會員記錄已建立, ID:", memberId);
    }

    // 獲取累積分潤
    let totalReward = 0;
    const memberResponse = await notion.pages.retrieve({ page_id: memberId! });
    if ("properties" in memberResponse) {
      const rewardProp = memberResponse.properties.累積分潤;
      if (rewardProp && "number" in rewardProp && typeof rewardProp.number === "number") {
        totalReward = rewardProp.number;
      }
    }

    console.log("[api/referral/generate] 分潤金額:", totalReward);

    return NextResponse.json(
      {
        success: true,
        email,
        referralCode,
        totalCommission: totalReward,
        referralLink: `${process.env.NEXT_PUBLIC_SITE_URL || "https://beauty.site"}?ref=${referralCode}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/referral/generate] 錯誤:", error);
    return NextResponse.json(
      { error: "生成推薦碼失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
