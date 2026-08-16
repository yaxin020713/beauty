import { NextResponse } from "next/server";
import { DEFAULT_CONVENIENCE_711_STORES } from "@/lib/shipping";

export const dynamic = "force-static";
export const revalidate = 3600; // 快取 1 小時

export async function GET() {
  try {
    // TODO: 未來可從 Notion 資料庫或外部 API 動態加載
    // 目前返回預設門市列表
    const stores = DEFAULT_CONVENIENCE_711_STORES;

    return NextResponse.json(
      { stores },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      }
    );
  } catch (error) {
    console.error("[api/stores] 取得門市列表失敗:", error);
    return NextResponse.json(
      { error: "無法取得門市列表", stores: DEFAULT_CONVENIENCE_711_STORES },
      { status: 200 } // 返回預設資料作為後備方案
    );
  }
}
