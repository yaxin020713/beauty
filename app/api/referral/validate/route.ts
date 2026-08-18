import { NextRequest, NextResponse } from "next/server";
import { notion, MEMBERS_DB_ID } from "@/lib/notion";
import { isValidReferralCode } from "@/lib/referral";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { referralCode?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const referralCode = (body.referralCode ?? "").trim().toUpperCase();

  if (!referralCode || !isValidReferralCode(referralCode)) {
    return NextResponse.json(
      { error: "推薦碼格式無效" },
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
    // 查詢推薦碼對應的會員
    const queryResponse = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: "推薦碼",
        rich_text: {
          equals: referralCode,
        },
      },
    });

    if (queryResponse.results.length === 0) {
      return NextResponse.json(
        { error: "推薦碼不存在" },
        { status: 404 }
      );
    }

    const memberPage = queryResponse.results[0];
    let email = "";

    if ("properties" in memberPage) {
      const emailProperty = memberPage.properties.Email;
      if (
        emailProperty &&
        "rich_text" in emailProperty &&
        Array.isArray(emailProperty.rich_text) &&
        emailProperty.rich_text.length > 0
      ) {
        email = emailProperty.rich_text[0].plain_text;
      }
    }

    return NextResponse.json(
      {
        success: true,
        referralCode,
        referrerEmail: email,
        valid: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/referral/validate]:", error);
    return NextResponse.json(
      { error: "驗證推薦碼失敗" },
      { status: 500 }
    );
  }
}
