import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID, PRODUCTS_DB_ID, MEMBERS_DB_ID, updateProductReservedQuantity } from "@/lib/notion";

interface ReservationItem {
  productId: string;
  productName: string;
  variant?: { optionName: string };
  quantity: number;
}

type ShippingMethod = "convenience_711" | "face_to_face";

async function resolveReferrer(
  code: string,
  buyerEmail: string
): Promise<{ code: string; email: string } | null> {
  if (!code || !MEMBERS_DB_ID) return null;

  try {
    const referrerQuery = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: "推薦碼",
        rich_text: { equals: code },
      },
    });

    if (referrerQuery.results.length === 0) return null;

    const referrerPage = referrerQuery.results[0];
    if (!("properties" in referrerPage)) return null;

    const emailProp = referrerPage.properties.Email;
    const email =
      emailProp &&
      "title" in emailProp &&
      Array.isArray(emailProp.title) &&
      emailProp.title.length > 0
        ? emailProp.title[0].plain_text
        : "";

    if (!email) return null;

    const isSelfReferral = email.trim().toLowerCase() === buyerEmail.trim().toLowerCase();
    if (isSelfReferral) {
      console.warn(`[api/reservations] 偵測到自我推薦，忽略推薦碼 ${code}: ${buyerEmail}`);
      return null;
    }

    return { code, email };
  } catch (err) {
    console.warn(`[api/reservations] 查詢推薦碼 ${code} 失敗:`, err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Force Vercel rebuild: 2026-08-22T15:40:00Z
    const body = await request.json();
    const {
      items,
      customerName,
      customerPhone,
      customerEmail,
      store7_11,
      shippingMethod,
      shippingFee,
      totalPrice,
      totalAmount,
      urlReferralCode,
      manualReferralCode,
    } = body;

    // 验证必填字段
    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      !customerName ||
      !customerPhone ||
      !customerEmail ||
      !shippingMethod
    ) {
      return NextResponse.json(
        { error: "缺少必要信息" },
        { status: 400 }
      );
    }

    // 如果是7-11超商，需要门市编号
    if (shippingMethod === "convenience_711" && !store7_11) {
      return NextResponse.json(
        { error: "请选择7-11门市编号" },
        { status: 400 }
      );
    }

    // 生成 Order_ID
    const orderId = `訂單-${Date.now()}`;

    // 生成 Items_Detail 字符串（多行格式）
    const itemsDetail = items
      .map((item: ReservationItem) =>
        item.variant
          ? `${item.productName} (${item.variant.optionName}) x${item.quantity}`
          : `${item.productName} x${item.quantity}`
      )
      .join("\n");

    // Items_Detail 只包含商品列表，收貨方式已有專門欄位
    const fullItemsDetail = itemsDetail;

    // 保存到 Orders 表
    const properties: Record<string, any> = {
      "Order_ID": {
        title: [{ text: { content: orderId } }],
      },
      "Customer_Name": {
        rich_text: [{ text: { content: customerName } }],
      },
      "Customer_Phone": {
        rich_text: [{ text: { content: customerPhone } }],
      },
      "Items_Detail": {
        rich_text: [{ text: { content: fullItemsDetail } }],
      },
      "聯繫用Email": {
        rich_text: [{ text: { content: customerEmail } }],
      },
      "Total_Price": {
        number: totalAmount || (totalPrice + shippingFee),
      },
      "訂單狀態": {
        select: { name: "新訂單" },
      },
    };

    // 如果是7-11超商，添加门市店号
    if (shippingMethod === "convenience_711") {
      properties["7-11取貨店號"] = {
        rich_text: [{ text: { content: store7_11 } }],
      };
    }

    // 處理推薦碼邏輯
    // 優先使用手動輸入的推薦碼，其次使用 URL 參數的推薦碼
    const primaryCode = manualReferralCode || urlReferralCode;
    const secondaryCode =
      manualReferralCode && urlReferralCode && manualReferralCode !== urlReferralCode
        ? urlReferralCode
        : null;

    // 解析主推薦碼
    if (primaryCode) {
      const referrer = await resolveReferrer(primaryCode, customerEmail);
      if (referrer) {
        properties["推薦碼"] = {
          rich_text: [{ text: { content: referrer.code } }],
        };
        properties["推薦人Email"] = {
          rich_text: [{ text: { content: referrer.email } }],
        };
      }
    }

    // 如果有次推薦碼（兩個推薦碼不同），解析並存儲
    if (secondaryCode) {
      const secondaryReferrer = await resolveReferrer(secondaryCode, customerEmail);
      if (secondaryReferrer) {
        properties["次推薦碼"] = {
          rich_text: [{ text: { content: secondaryReferrer.code } }],
        };
        properties["次推薦人Email"] = {
          rich_text: [{ text: { content: secondaryReferrer.email } }],
        };
      }
    }

    await notion.pages.create({
      parent: { database_id: ORDERS_DB_ID },
      properties,
    });

    // 为每个商品更新 Reserved_Quantity
    for (const item of items) {
      try {
        // 查询该商品的 Notion page ID
        const productQuery = await notion.databases.query({
          database_id: PRODUCTS_DB_ID,
          filter: {
            property: "product_id",
            rich_text: {
              equals: item.productId,
            },
          },
          page_size: 1,
        });

        if (productQuery.results.length > 0) {
          const productPageId = productQuery.results[0].id;
          await updateProductReservedQuantity(productPageId, item.quantity);
        }
      } catch (itemError) {
        console.error(
          `[api/reservations] 更新商品 ${item.productId} 的 Reserved_Quantity 失敗:`,
          itemError
        );
        // 继续处理其他商品，不中断流程
      }
    }

    return NextResponse.json(
      {
        success: true,
        orderId: orderId,
        message: "預訂成功，請等待我們的聯繫",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/reservations] 預訂失敗:", error);
    return NextResponse.json(
      { error: "預訂失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
