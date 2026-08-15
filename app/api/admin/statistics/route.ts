import { NextRequest, NextResponse } from "next/server";
import { notion, PRODUCTS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 查詢所有商品
    const response = await notion.databases.query({
      database_id: PRODUCTS_DB_ID,
      sorts: [
        {
          property: "Total_Sold",
          direction: "descending",
        },
      ],
    });

    const statistics = response.results.map((page) => {
      if (!("properties" in page)) return null;

      const props = page.properties;
      const name =
        props.Name?.type === "title" && Array.isArray(props.Name.title)
          ? props.Name.title[0]?.plain_text || ""
          : "";
      const price =
        props.Price?.type === "number" ? props.Price.number || 0 : 0;
      const totalSold =
        props.Total_Sold?.type === "number" ? props.Total_Sold.number || 0 : 0;
      const category =
        props.Category?.type === "select" && props.Category.select
          ? (props.Category.select as any).name || ""
          : "";

      return {
        id: page.id,
        name,
        category,
        price,
        totalSold,
      };
    });

    const filteredStats = statistics.filter((stat) => stat !== null);

    // 計算總銷售額和總銷售量
    const totalRevenue = filteredStats.reduce((sum: number, product: any) => {
      return sum + ((product.price || 0) * (product.totalSold || 0));
    }, 0);
    const totalUnitsSold = filteredStats.reduce((sum: number, product: any) => {
      return sum + (product.totalSold || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalProductCount: filteredStats.length,
        totalUnitsSold,
        totalRevenue,
        startDate: startDate || "全部時間",
        endDate: endDate || "全部時間",
      },
      products: filteredStats,
    });
  } catch (error) {
    console.error("[api/admin/statistics] 獲取統計失敗:", error);
    return NextResponse.json(
      { error: "獲取統計失敗" },
      { status: 500 }
    );
  }
}
