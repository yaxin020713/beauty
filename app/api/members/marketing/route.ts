import { NextRequest, NextResponse } from "next/server";
import { MEMBERS_DB_ID } from "@/lib/notion";
import { setMarketingOptIn } from "@/lib/referral";

export const dynamic = "force-dynamic";

// 會員專區的行銷訂閱開關：訂閱或取消訂閱團購檔期、新品與優惠通知
export async function POST(request: NextRequest) {
  let body: { email?: string; optIn?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();

  if (!email || typeof body.optIn !== "boolean") {
    return NextResponse.json(
      { error: "需要提供 email 與訂閱狀態" },
      { status: 400 }
    );
  }

  if (!MEMBERS_DB_ID) {
    return NextResponse.json({ error: "系統配置不完整" }, { status: 500 });
  }

  const ok = await setMarketingOptIn(email, body.optIn);
  if (!ok) {
    return NextResponse.json(
      { error: "無法更新訂閱設定，請稍後再試" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      marketingOptIn: body.optIn,
      // 取消訂閱時保留原本的訂閱時間，前端維持顯示舊值即可
      marketingOptInAt: body.optIn ? new Date().toISOString() : undefined,
    },
    { status: 200 }
  );
}
