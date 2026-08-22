import { NextRequest, NextResponse } from "next/server";
import { notion, PRODUCT_VARIANTS_DB_ID } from "@/lib/notion";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { email, variants } = await request.json();

  if (!email || !id || !Array.isArray(variants)) {
    return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
  }

  try {
    const results = [];

    for (const variant of variants) {
      if (!variant.optionName) continue;

      const res = await notion.pages.create({
        parent: { database_id: PRODUCT_VARIANTS_DB_ID },
        properties: {
          "Option_Name": {
            select: { name: variant.optionName },
          },
          "Product": {
            relation: [{ id }],
          },
          "Stock": {
            number: variant.stock || 0,
          },
        } as Record<string, any>,
      });

      results.push({ id: res.id, optionName: variant.optionName });
    }

    return NextResponse.json({ variants: results }, { status: 201 });
  } catch (error) {
    console.error("[api/variants-manage] 建立失敗:", error);
    return NextResponse.json(
      { error: "建立選項失敗" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { variantId, stock } = await request.json();

  if (!variantId) {
    return NextResponse.json({ error: "缺少 variantId" }, { status: 400 });
  }

  try {
    await notion.pages.update({
      page_id: variantId,
      properties: {
        "Stock": {
          number: stock ?? 0,
        },
      } as Record<string, any>,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[api/variants-manage] 更新失敗:", error);
    return NextResponse.json(
      { error: "更新選項失敗" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { variantId } = await request.json();

  if (!variantId) {
    return NextResponse.json({ error: "缺少 variantId" }, { status: 400 });
  }

  try {
    await notion.pages.update({
      page_id: variantId,
      archived: true,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[api/variants-manage] 刪除失敗:", error);
    return NextResponse.json(
      { error: "刪除選項失敗" },
      { status: 500 }
    );
  }
}
