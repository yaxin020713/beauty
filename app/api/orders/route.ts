import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID, MEMBERS_DB_ID, PRODUCTS_DB_ID } from "@/lib/notion";
import { calculateShippingFee, calculateDiscount, type ShippingMethod } from "@/lib/shipping";
import { calculateMembershipLevel } from "@/lib/membership";

// 前台購物車單一項目的型別
type CartItem = {
  productId: string;
  name: string;
  price: number;
  weight_g: number;
  quantity: number;
};

type OrderRequestBody = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentLast5?: string;
  shippingMethod?: string;
  selectedStore?: string;
  referralCode?: string;
  items?: CartItem[];
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: OrderRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const customerName = (body.customerName ?? "").trim();
  const customerPhone = (body.customerPhone ?? "").trim();
  const customerEmail = (body.customerEmail ?? "").trim();
  const referralCode = (body.referralCode ?? "").trim().toUpperCase();
  // 匯款末五碼：只保留數字並限 5 碼
  const paymentLast5 = String(body.paymentLast5 ?? "")
    .replace(/\D/g, "")
    .slice(-5);
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const shippingMethod = (body.shippingMethod ?? "convenience_711") as ShippingMethod;
  const selectedStore = (body.selectedStore ?? "").trim();

  if (!customerName || !customerPhone || !customerEmail) {
    return NextResponse.json({ error: "請填寫姓名、電話與 Email" }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(customerEmail)) {
    return NextResponse.json({ error: "請輸入有效的 Email 格式" }, { status: 400 });
  }

  if (rawItems.length === 0) {
    return NextResponse.json({ error: "購物車是空的" }, { status: 400 });
  }

  // 驗證收貨方式
  if (shippingMethod === "convenience_711" && !selectedStore) {
    return NextResponse.json({ error: "請選擇 7-11 超商門市" }, { status: 400 });
  }

  // 清理並正規化購物車資料，避免前端傳入非法數值
  const items: CartItem[] = rawItems.map((item) => ({
    productId: String(item?.productId ?? ""),
    name: String(item?.name ?? ""),
    price: Number(item?.price) || 0,
    weight_g: Number(item?.weight_g) || 0,
    quantity: Math.max(1, Math.floor(Number(item?.quantity) || 0)),
  }));

  if (items.some((item) => !item.productId || !item.name)) {
    return NextResponse.json({ error: "購物車資料不完整" }, { status: 400 });
  }

  // 自動計算商品小計
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 自動計算運費（後端重新計算，不信任前端值；滿 FREE_SHIPPING_THRESHOLD 免運）
  const shippingFee = calculateShippingFee(subtotal, shippingMethod);

  // 自動計算滿額現折（後端重新計算，不信任前端值）
  const discount = calculateDiscount(subtotal);

  // 自動計算總金額與總重量（kg）
  const totalPrice = subtotal + shippingFee - discount;
  const totalWeightKg = Number(
    items
      .reduce((sum, item) => sum + (item.weight_g * item.quantity) / 1000, 0)
      .toFixed(3)
  );

  // 組合收貨方式資訊
  const shippingInfo = shippingMethod === "convenience_711"
    ? `7-11 超商取貨 (門市編號: ${selectedStore})`
    : "面交";

  // 組合商品明細文字，附上該商品此訂單的總重量，例："小黑瓶 x2（200g）, 白繃帶 x1（50g）"
  const itemsDetail = items
    .map((item) => `${item.name} x${item.quantity}（${item.weight_g * item.quantity}g）`)
    .join(", ");

  const orderId = `訂單-${Date.now()}`;

  try {
    // 0. 處理推薦碼：查詢推薦人信箱，並計算分潤
    let referrerEmail = "";
    let totalReferralCommission = 0;

    if (referralCode) {
      try {
        // 查詢推薦碼對應的推薦人
        const referrerQuery = await notion.databases.query({
          database_id: MEMBERS_DB_ID,
          filter: {
            property: "推薦碼",
            rich_text: { equals: referralCode },
          },
        });

        if (referrerQuery.results.length > 0) {
          const referrerPage = referrerQuery.results[0];
          if ("properties" in referrerPage) {
            const emailProp = referrerPage.properties.Email;
            if (
              emailProp &&
              "title" in emailProp &&
              Array.isArray(emailProp.title) &&
              emailProp.title.length > 0
            ) {
              referrerEmail = emailProp.title[0].plain_text;
            }
          }

          // 計算分潤：遍歷訂單品項，查詢每個產品的分潤字段
          for (const item of items) {
            try {
              const productPage = await notion.pages.retrieve({ page_id: item.productId });
              if ("properties" in productPage) {
                const rewardProp = productPage.properties.分潤;
                if (rewardProp && "number" in rewardProp && typeof rewardProp.number === "number") {
                  totalReferralCommission += (rewardProp.number || 0) * item.quantity;
                }
              }
            } catch (err) {
              console.warn(`[api/orders] 無法查詢商品 ${item.productId} 的分潤:`, err);
            }
          }
        }
      } catch (err) {
        console.warn("[api/orders] 處理推薦碼失敗:", err);
      }
    }

    // 1. 建立訂單頁面
    // 在 Items_Detail 中附加運費、收貨方式與匯款末五碼資訊
    const detailWithShipping = `${itemsDetail}\n運費: ${shippingFee > 0 ? `NT$${shippingFee}` : "免運"} | 取貨: ${shippingInfo}${discount > 0 ? ` | 滿額現折: -NT$${discount}` : ""}\n匯款末五碼: ${paymentLast5}`;

    const properties: Record<string, any> = {
      Order_ID: { title: [{ text: { content: orderId } }] },
      Customer_Name: { rich_text: [{ text: { content: customerName } }] },
      Customer_Phone: { rich_text: [{ text: { content: customerPhone } }] },
      "聯繫用Email": { rich_text: [{ text: { content: customerEmail } }] },
      Items_Detail: { rich_text: [{ text: { content: detailWithShipping } }] },
      Total_Price: { number: totalPrice },
      Total_Weight_kg: { number: totalWeightKg },
      "訂單狀態": { select: { name: "新訂單" } },
    };

    // 推薦碼和推薦人信箱
    if (referralCode) {
      properties.推薦碼 = { rich_text: [{ text: { content: referralCode } }] };
    }
    if (referrerEmail) {
      properties.推薦人信箱 = { rich_text: [{ text: { content: referrerEmail } }] };
    }
    if (totalReferralCommission > 0) {
      properties.分潤 = { number: totalReferralCommission };
    }

    // 7-11 取貨：寫入門市店號；面交：於面交否欄位標記「面交」
    if (shippingMethod === "convenience_711") {
      properties["7-11取貨店號"] = { rich_text: [{ text: { content: selectedStore } }] };
    } else if (shippingMethod === "face_to_face") {
      properties["面交否"] = { rich_text: [{ text: { content: "面交" } }] };
    }

    // 帳號末5碼（數字型別）
    if (paymentLast5) {
      properties["帳號末5碼"] = { number: Number(paymentLast5) };
    }

    await notion.pages.create({
      parent: { database_id: ORDERS_DB_ID },
      properties,
    });

    // 2. 逐項更新商品的 Total_Sold（累加購買數量）
    for (const item of items) {
      try {
        const productPage = await notion.pages.retrieve({
          page_id: item.productId,
        });

        let currentSold = 0;
        if ("properties" in productPage) {
          const prop = productPage.properties["Total_Sold"];
          if (prop?.type === "number") {
            currentSold = prop.number ?? 0;
          }
        }

        await notion.pages.update({
          page_id: item.productId,
          properties: {
            Total_Sold: { number: currentSold + item.quantity },
          },
        });
      } catch (error) {
        // 如果產品不存在或無法更新，繼續處理其他訂單項目
        console.warn(`[api/orders] 無法更新商品 ${item.productId} 的銷量:`, error instanceof Error ? error.message : error);
      }
    }

    // 3. 如果有推薦人，更新推薦人的累積分潤
    if (referrerEmail && totalReferralCommission > 0) {
      try {
        // 查詢推薦人
        const referrerQuery = await notion.databases.query({
          database_id: MEMBERS_DB_ID,
          filter: {
            property: "Email",
            title: { equals: referrerEmail },
          },
        });

        if (referrerQuery.results.length > 0) {
          const referrerPage = referrerQuery.results[0];
          const referrerId = referrerPage.id;

          // 獲取推薦人目前的累積分潤
          let currentCommission = 0;
          if ("properties" in referrerPage) {
            const rewardProp = referrerPage.properties.累積分潤;
            if (rewardProp && "number" in rewardProp && typeof rewardProp.number === "number") {
              currentCommission = rewardProp.number || 0;
            }
          }

          // 更新推薦人的累積分潤
          await notion.pages.update({
            page_id: referrerId,
            properties: {
              累積分潤: { number: currentCommission + totalReferralCommission },
            },
          });
        }
      } catch (error) {
        console.warn("[api/orders] 無法更新推薦人的分潤:", error instanceof Error ? error.message : error);
      }
    }

    // 4. 更新購物者（客戶）的消費金額和會員等級
    if (customerEmail) {
      try {
        const customerQuery = await notion.databases.query({
          database_id: MEMBERS_DB_ID,
          filter: {
            property: "Email",
            title: { equals: customerEmail.toLowerCase() },
          },
        });

        if (customerQuery.results.length > 0) {
          const customerPage = customerQuery.results[0];
          const customerId = customerPage.id;

          // 獲取客戶目前的一年內消費金額
          let currentSpending = 0;
          if ("properties" in customerPage) {
            const spendingProp = customerPage.properties.一年內累計消費金額;
            if (spendingProp && "number" in spendingProp && typeof spendingProp.number === "number") {
              currentSpending = spendingProp.number || 0;
            }
          }

          // 計算新的消費金額和會員等級
          const newSpending = currentSpending + totalPrice;
          const newLevel = calculateMembershipLevel(newSpending);

          // 更新客戶的消費金額和會員等級
          await notion.pages.update({
            page_id: customerId,
            properties: {
              一年內累計消費金額: { number: newSpending },
              會員等級: { select: { name: newLevel } },
            },
          });
        } else {
          // 如果客戶還不存在，建立新的會員記錄
          const newLevel = calculateMembershipLevel(totalPrice);
          await notion.pages.create({
            parent: { database_id: MEMBERS_DB_ID },
            properties: {
              Email: {
                title: [{ text: { content: customerEmail.toLowerCase() } }],
              },
              會員等級: {
                select: { name: newLevel },
              },
              一年內累計消費金額: {
                number: totalPrice,
              },
              累積分潤: {
                number: 0,
              },
              待提現分潤: {
                number: 0,
              },
            },
          });
        }
      } catch (error) {
        console.warn("[api/orders] 無法更新客戶的消費金額:", error instanceof Error ? error.message : error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        orderId,
        totalPrice,
        totalWeightKg,
        shippingFee,
        discount,
        itemsDetail,
        ...(referralCode && { referralCode }),
        ...(referrerEmail && { referrerEmail }),
        ...(totalReferralCommission > 0 && { referralCommission: totalReferralCommission }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/orders] 建立訂單失敗:", error);
    return NextResponse.json(
      { error: "建立訂單失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
