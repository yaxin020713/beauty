import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

type UpdateRequest = {
  status?: string;
  paymentStatus?: string;
  faceToFace?: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const body: UpdateRequest = await request.json();
    const pageId = params.orderId;

    const updateProps: any = {};

    if (body.status) {
      updateProps.Status = { select: { name: body.status } };
    }

    if (body.paymentStatus) {
      updateProps.Payment_Status = { select: { name: body.paymentStatus } };
    }

    if (body.faceToFace !== undefined) {
      updateProps["面交否"] = { rich_text: [{ text: { content: body.faceToFace } }] };
    }

    if (Object.keys(updateProps).length === 0) {
      return NextResponse.json(
        { error: "沒有要更新的欄位" },
        { status: 400 }
      );
    }

    await notion.pages.update({
      page_id: pageId,
      properties: updateProps,
    });

    return NextResponse.json({
      success: true,
      message: "訂單已更新",
    });
  } catch (error) {
    console.error("[api/admin/orders/[orderId]] 更新訂單失敗:", error);
    return NextResponse.json(
      { error: "更新訂單失敗" },
      { status: 500 }
    );
  }
}
