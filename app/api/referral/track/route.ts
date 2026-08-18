import { NextRequest, NextResponse } from "next/server";
import { notion, MEMBERS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

// 當用戶透過推薦碼下單時，記錄推薦關係並獎勵推薦人
export async function POST(request: NextRequest) {
  let body: {
    referralCode?: string;
    customerEmail?: string;
    orderId?: string;
    rewardAmount?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const referralCode = (body.referralCode ?? "").trim().toUpperCase();
  const customerEmail = (body.customerEmail ?? "").trim().toLowerCase();
  const orderId = (body.orderId ?? "").trim();
  const rewardAmount = body.rewardAmount ?? 50; // 預設返利 $50 NTD

  if (!referralCode || !customerEmail || !orderId) {
    return NextResponse.json(
      { error: "缺少必要參數" },
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
    // 查詢推薦碼對應的推薦人
    const referrerQueryResponse = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: "推薦碼",
        rich_text: {
          equals: referralCode,
        },
      },
    });

    if (referrerQueryResponse.results.length === 0) {
      return NextResponse.json(
        { error: "推薦碼不存在" },
        { status: 404 }
      );
    }

    const referrerPage = referrerQueryResponse.results[0];
    const referrerId = referrerPage.id;

    // 獲取推薦人目前的統計
    let currentReferralCount = 0;
    let currentTotalReward = 0;

    if ("properties" in referrerPage) {
      const countProp = referrerPage.properties.訂單數;
      if (countProp && "number" in countProp && typeof countProp.number === "number") {
        currentReferralCount = countProp.number || 0;
      }

      const rewardProp = referrerPage.properties.累積返利;
      if (rewardProp && "number" in rewardProp && typeof rewardProp.number === "number") {
        currentTotalReward = rewardProp.number || 0;
      }
    }

    // 更新推薦人的統計（只有新會員才算一次推薦）
    const customerQueryResponse = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: "email",
        email: {
          equals: customerEmail,
        },
      },
    });

    let isNewCustomer = customerQueryResponse.results.length === 0;

    if (isNewCustomer) {
      // 新會員：建立記錄並記錄推薦人
      await notion.pages.create({
        parent: { database_id: MEMBERS_DB_ID },
        properties: {
          email: {
            email: customerEmail,
          },
          推薦人信箱: {
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

      // 更新推薦人的獎勵
      await notion.pages.update({
        page_id: referrerId,
        properties: {
          累積返利: {
            number: currentTotalReward + rewardAmount,
          },
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        isNewCustomer,
        message: isNewCustomer
          ? "推薦成功！推薦人獲得 $50 NTD 獎勵"
          : "用戶已存在，不重複計算推薦",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/referral/track]:", error);
    // 記錄錯誤但不中斷訂單流程
    return NextResponse.json(
      {
        success: false,
        error: "無法處理推薦獎勵，但訂單已建立",
      },
      { status: 500 }
    );
  }
}
