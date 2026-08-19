import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID } from "@/lib/notion";
import { applyReferralCommission } from "@/lib/referral";

export const dynamic = "force-dynamic";

type UpdateRequest = {
  status?: string;
  paymentStatus?: string;
  faceToFace?: string;
  shippingDate?: string;
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
      updateProps["訂單狀態"] = { select: { name: body.status } };
    }

    if (body.paymentStatus) {
      updateProps["付款狀態"] = { select: { name: body.paymentStatus } };
    }

    if (body.faceToFace !== undefined) {
      updateProps["面交否"] = { rich_text: [{ text: { content: body.faceToFace } }] };
    }

    if (body.shippingDate) {
      updateProps["出貨日期"] = { date: { start: body.shippingDate } };
    }

    if (Object.keys(updateProps).length === 0) {
      return NextResponse.json(
        { error: "沒有要更新的欄位" },
        { status: 400 }
      );
    }

    // 若這次操作要把訂單狀態改為「已完成」，須先確認目前狀態尚未是「已完成」，
    // 避免管理員重複保存同一狀態時，分潤被重複入帳給推薦人
    let orderPageForCommission: unknown = null;
    if (body.status === "已完成") {
      const currentPage = await notion.pages.retrieve({ page_id: pageId });
      if ("properties" in currentPage) {
        const statusProp = currentPage.properties["訂單狀態"];
        const currentStatus =
          statusProp?.type === "select" && statusProp.select
            ? (statusProp.select as any).name
            : "";
        if (currentStatus !== "已完成") {
          orderPageForCommission = currentPage;
        }
      }
    }

    await notion.pages.update({
      page_id: pageId,
      properties: updateProps,
    });

    if (orderPageForCommission) {
      try {
        await applyReferralCommission(orderPageForCommission);
      } catch (error) {
        console.error("[api/admin/orders/[orderId]] 分潤入帳失敗:", error);
      }
    }

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
