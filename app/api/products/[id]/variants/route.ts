import { NextRequest, NextResponse } from "next/server";
import { notion, PRODUCTS_DB_ID, PRODUCT_VARIANTS_DB_ID } from "@/lib/notion";
import type { ProductVariant } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;

  if (!productId) {
    return NextResponse.json({ error: "缺少 productId" }, { status: 400 });
  }

  try {
    // 先用 product_id 查詢 Products 表找到 Notion page ID
    const productQuery = await notion.databases.query({
      database_id: PRODUCTS_DB_ID,
      filter: {
        property: "product_id",
        rich_text: {
          equals: productId,
        },
      },
      page_size: 1,
    });

    if (productQuery.results.length === 0) {
      return NextResponse.json(
        { error: "商品不存在" },
        { status: 404 }
      );
    }

    const notionPageId = productQuery.results[0].id;

    // 再用 Notion page ID 查詢 ProductVariants
    const query = await notion.databases.query({
      database_id: PRODUCT_VARIANTS_DB_ID,
      filter: {
        property: "Product",
        relation: {
          contains: notionPageId,
        },
      },
    });

    const variants: ProductVariant[] = query.results
      .map((page) => {
        if (!("properties" in page)) return null;

        const props = page.properties as Record<string, any>;
        const variantId = page.id;

        const productProp = props.Product;
        let relatedProductId = "";
        if (productProp && "relation" in productProp && Array.isArray(productProp.relation)) {
          relatedProductId = productProp.relation[0]?.id || "";
        }

        const optionProp = props.Option_Name;
        let optionName = "";
        if (optionProp && "select" in optionProp && optionProp.select) {
          optionName = optionProp.select.name || "";
        }

        const stockProp = props.Stock;
        const stock =
          stockProp && "number" in stockProp ? (stockProp.number ?? 0) : 0;

        if (!optionName) return null;

        return {
          id: variantId,
          productId: relatedProductId,
          optionName,
          stock,
        };
      })
      .filter((v) => v !== null) as ProductVariant[];

    return NextResponse.json({ variants }, { status: 200 });
  } catch (error) {
    console.error("[api/products/variants] 查詢失敗:", error);
    return NextResponse.json(
      { error: "查詢產品變體失敗" },
      { status: 500 }
    );
  }
}
