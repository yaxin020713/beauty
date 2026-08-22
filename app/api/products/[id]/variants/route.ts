import { NextRequest, NextResponse } from "next/server";
import { notion, PRODUCT_VARIANTS_DB_ID } from "@/lib/notion";
import type { ProductVariant } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "缺少 productId" }, { status: 400 });
  }

  try {
    const query = await notion.databases.query({
      database_id: PRODUCT_VARIANTS_DB_ID,
      filter: {
        property: "Product",
        relation: {
          contains: id,
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
