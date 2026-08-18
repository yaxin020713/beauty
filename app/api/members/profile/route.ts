import { NextRequest, NextResponse } from "next/server";
import { notion, MEMBERS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

type MemberData = {
  email: string;
  birthday?: string; // YYYY-MM-DD
  address?: string;
  bankCode?: string;
  bankAccount?: string;
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

      // 檢查必填字段
      const hasAllFields =
        props.生日 &&
        props.地址 &&
        props.銀行代碼 &&
        props.銀行帳號;

      memberData.profileComplete = !!hasAllFields;

      if (props.生日 && "date" in props.生日) {
        memberData.birthday = (props.生日 as any).date?.start || null;
      }

      if (props.地址 && "rich_text" in props.地址) {
        memberData.address = (props.地址 as any).rich_text?.[0]?.plain_text || null;
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

      if (props.累積分潤 && "number" in props.累積分潤) {
        memberData.totalCommission = (props.累積分潤 as any).number || 0;
      }

      if (props.待提現分潤 && "number" in props.待提現分潤) {
        memberData.pendingCommission = (props.待提現分潤 as any).number || 0;
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
        title: { equals: email },
      },
    });

    const properties: Record<string, any> = {};

    if (body.birthday) {
      properties.生日 = { date: { start: body.birthday } };
    }

    if (body.address) {
      properties.地址 = {
        rich_text: [{ text: { content: body.address } }],
      };
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

    if (queryResponse.results.length > 0) {
      // 更新現有會員
      const memberId = queryResponse.results[0].id;
      await notion.pages.update({
        page_id: memberId,
        properties,
      });
    } else {
      // 建立新會員（預設銅級、消費金額 0）
      properties.Email = {
        title: [{ text: { content: email } }],
      };
      properties.會員等級 = {
        select: { name: "銅級" },
      };
      properties.一年內累計消費金額 = {
        number: 0,
      };
      properties.累積分潤 = {
        number: 0,
      };
      properties.待提現分潤 = {
        number: 0,
      };

      await notion.pages.create({
        parent: { database_id: MEMBERS_DB_ID },
        properties,
      });
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
    return NextResponse.json(
      { error: "無法保存會員資料" },
      { status: 500 }
    );
  }
}
