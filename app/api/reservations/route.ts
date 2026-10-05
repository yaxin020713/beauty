import { NextRequest, NextResponse } from "next/server";
import { notion, ORDERS_DB_ID, PRODUCTS_DB_ID, MEMBERS_DB_ID, updateProductReservedQuantity } from "@/lib/notion";
import { recordTermsAgreementIfNeeded, recordMarketingOptIn, creditUnrealizedCommission } from "@/lib/referral";
import { calculateMembershipLevel } from "@/lib/membership";

interface ReservationItem {
  productId: string;
  productName: string;
  variant?: { optionName: string };
  quantity: number;
}

type ShippingMethod = "convenience_711";

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
      agreedToTerms,
      marketingOptIn,
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

    // 必須同意會員資料使用條款才能下單（伺服器端再驗證一次，避免繞過前端限制）
    if (!agreedToTerms) {
      return NextResponse.json(
        { error: "請先閱讀並同意會員資料使用條款" },
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

    const orderTotal = totalAmount || (totalPrice + shippingFee);

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
        number: orderTotal,
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

    // 計算分潤金：根據每個商品的分潤值 × 數量加總；同時檢查每個品項是否仍上架中
    let totalCommission = 0;
    for (const item of items) {
      try {
        const productQuery = await notion.databases.query({
          database_id: PRODUCTS_DB_ID,
          filter: {
            property: "product_id",
            rich_text: { equals: item.productId },
          },
          page_size: 1,
        });

        if (productQuery.results.length > 0) {
          const productPage = productQuery.results[0];
          if (!("properties" in productPage)) continue;
          const productProps = productPage.properties;

          const delistedProp = productProps["下架"];
          const isDelisted =
            !!delistedProp && "checkbox" in delistedProp && delistedProp.checkbox === true;
          if (isDelisted) {
            return NextResponse.json(
              { error: `商品「${item.productName}」已下架，暫不開放預訂` },
              { status: 400 }
            );
          }

          const commissionProp = productProps.分潤;
          if (commissionProp && "number" in commissionProp && typeof commissionProp.number === "number") {
            const itemCommission = commissionProp.number * item.quantity;
            totalCommission += itemCommission;
          }
        }
      } catch (err) {
        console.warn(`[api/reservations] 查詢商品 ${item.productId} 的分潤失敗:`, err);
      }
    }

    // 處理推薦碼邏輯
    // 情況A：推薦連結進入，未修改 → 推薦碼 + 推薦人信箱 + 分潤（主要分潤金）
    // 情況B：推薦連結進入，手動修改碼，且兩者是不同人 → 分潤各半：
    //        推薦碼/推薦人信箱/分潤 記連結推薦人（取較小的一半），
    //        推薦碼2/推薦人信箱2/分潤2 記手動輸入的推薦人（取較大的一半）
    // 情況C：官方連結進入，手動填寫碼 → 推薦碼2 + 推薦人信箱2 + 分潤2（次要分潤金）

    // 記錄這張訂單實際應該入帳「待實現分潤」的推薦人信箱與金額（可能同時有兩位）
    const commissionCredits: { email: string; amount: number }[] = [];

    if (manualReferralCode && urlReferralCode && manualReferralCode === urlReferralCode) {
      // 情況A：推薦連結進入未修改（manualCode自動填充等於urlCode）
      const referrer = await resolveReferrer(urlReferralCode, customerEmail);
      if (referrer) {
        properties["推薦碼"] = {
          rich_text: [{ text: { content: referrer.code } }],
        };
        properties["推薦人信箱"] = {
          rich_text: [{ text: { content: referrer.email } }],
        };
        // 分潤金全部存入分潤（主要字段）
        properties["分潤"] = { number: totalCommission };
        if (totalCommission > 0) {
          commissionCredits.push({ email: referrer.email, amount: totalCommission });
        }
      }
    } else if (manualReferralCode && urlReferralCode && manualReferralCode !== urlReferralCode) {
      // 情況B：推薦連結進入但手動修改碼
      const linkReferrer = await resolveReferrer(urlReferralCode, customerEmail);
      const manualReferrer = await resolveReferrer(manualReferralCode, customerEmail);
      const isSamePerson =
        !!linkReferrer &&
        !!manualReferrer &&
        linkReferrer.email.toLowerCase() === manualReferrer.email.toLowerCase();

      if (linkReferrer && manualReferrer && !isSamePerson) {
        // 兩個推薦碼都有效，且確實是不同人 → 分潤各半
        const linkShare = Math.floor(totalCommission / 2);
        const manualShare = Math.ceil(totalCommission / 2);

        properties["推薦碼"] = { rich_text: [{ text: { content: linkReferrer.code } }] };
        properties["推薦人信箱"] = { rich_text: [{ text: { content: linkReferrer.email } }] };
        if (linkShare > 0) properties["分潤"] = { number: linkShare };

        properties["推薦碼2"] = { rich_text: [{ text: { content: manualReferrer.code } }] };
        properties["推薦人信箱2"] = { rich_text: [{ text: { content: manualReferrer.email } }] };
        if (manualShare > 0) properties["分潤2"] = { number: manualShare };

        if (linkShare > 0) commissionCredits.push({ email: linkReferrer.email, amount: linkShare });
        if (manualShare > 0) commissionCredits.push({ email: manualReferrer.email, amount: manualShare });
      } else {
        // 只有一方查得到有效推薦人（或兩者其實是同一人）→ 該推薦人全額分潤
        const soleReferrer = manualReferrer ?? linkReferrer;
        if (soleReferrer) {
          properties["推薦碼2"] = { rich_text: [{ text: { content: soleReferrer.code } }] };
          properties["推薦人信箱2"] = { rich_text: [{ text: { content: soleReferrer.email } }] };
          properties["分潤2"] = { number: totalCommission };
          if (totalCommission > 0) {
            commissionCredits.push({ email: soleReferrer.email, amount: totalCommission });
          }
        }
      }
    } else if (manualReferralCode && !urlReferralCode) {
      // 情況C：官方連結進入，手動填寫碼
      const secondaryReferrer = await resolveReferrer(manualReferralCode, customerEmail);
      if (secondaryReferrer) {
        properties["推薦碼2"] = {
          rich_text: [{ text: { content: secondaryReferrer.code } }],
        };
        properties["推薦人信箱2"] = {
          rich_text: [{ text: { content: secondaryReferrer.email } }],
        };
        // 分潤金全部存入分潤2（次要字段），推薦碼和推薦人信箱留空
        properties["分潤2"] = { number: totalCommission };
        if (totalCommission > 0) {
          commissionCredits.push({ email: secondaryReferrer.email, amount: totalCommission });
        }
      }
    } else if (urlReferralCode && !manualReferralCode) {
      // 推薦連結進入，未填寫manualCode（邊界情況）
      const referrer = await resolveReferrer(urlReferralCode, customerEmail);
      if (referrer) {
        properties["推薦碼"] = {
          rich_text: [{ text: { content: referrer.code } }],
        };
        properties["推薦人信箱"] = {
          rich_text: [{ text: { content: referrer.email } }],
        };
        // 分潤金全部存入分潤（主要字段）
        properties["分潤"] = { number: totalCommission };
        if (totalCommission > 0) {
          commissionCredits.push({ email: referrer.email, amount: totalCommission });
        }
      }
    } else if (totalCommission > 0) {
      // 無推薦碼情況：仍存儲分潤金（但無推薦人，分潤不會入帳）
      properties["分潤"] = { number: totalCommission };
    }

    await notion.pages.create({
      parent: { database_id: ORDERS_DB_ID },
      properties,
    });

    // 把這筆訂單的分潤加進對應推薦人的「待實現分潤」（下單當下即入帳，訂單完成後才轉入待提現分潤）
    for (const credit of commissionCredits) {
      try {
        await creditUnrealizedCommission(credit.email, credit.amount);
        console.log(
          `[api/reservations] 已為推薦人 ${credit.email} 入帳待實現分潤 ${credit.amount}（訂單 ${orderId}）`
        );
      } catch (err) {
        console.error(
          `[api/reservations] 為推薦人 ${credit.email} 入帳待實現分潤失敗（訂單 ${orderId}）:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    // 補記錄條款同意時間（若該會員之前是選擇「稍後再填」略過完成會員檔案，就會在這裡第一次留下同意紀錄）
    await recordTermsAgreementIfNeeded(customerEmail);

    // 更新（或建立）顧客的會員紀錄：累加訂單數、記錄本次下預訂單的日期
    if (customerEmail && MEMBERS_DB_ID) {
      try {
        const customerQuery = await notion.databases.query({
          database_id: MEMBERS_DB_ID,
          filter: {
            property: "Email",
            title: { equals: customerEmail.toLowerCase() },
          },
        });

        const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });

        // 消費金額/會員等級不在這裡計入：訂單狀態還只是「新訂單」，可能之後被取消或標記「異常中」
        // 而永遠不會完成。改在 creditMembershipSpendingOnCompletion（訂單轉為「已完成」時）才計入，
        // 避免無法完成的訂單把金額卡在會員等級裡扣不回來。
        if (customerQuery.results.length > 0) {
          const customerPage = customerQuery.results[0];
          let currentOrderCount = 0;
          if ("properties" in customerPage) {
            const countProp = customerPage.properties.訂單數;
            if (countProp && "number" in countProp && typeof countProp.number === "number") {
              currentOrderCount = countProp.number || 0;
            }
          }

          await notion.pages.update({
            page_id: customerPage.id,
            properties: {
              訂單數: { number: currentOrderCount + 1 },
              上次預定日期: { date: { start: today } },
            },
          });
        } else {
          // 顧客還不存在，建立新的會員記錄（消費金額/等級先以 0/銅級 起始）
          await notion.pages.create({
            parent: { database_id: MEMBERS_DB_ID },
            properties: {
              Email: { title: [{ text: { content: customerEmail.toLowerCase() } }] },
              會員等級: { select: { name: calculateMembershipLevel(0) } },
              一年內累計消費金額: { number: 0 },
              歷史累積分潤: { number: 0 },
              待提現分潤: { number: 0 },
              處理中分潤: { number: 0 },
              訂單數: { number: 1 },
              上次預定日期: { date: { start: today } },
              條款同意時間: { date: { start: new Date().toISOString() } },
            },
          });
        }
      } catch (err) {
        console.warn("[api/reservations] 無法更新客戶的訂單數/上次預定日期:", err);
      }
    }

    // 會員在結帳頁同意條款時一併勾選了行銷訂閱（放在會員紀錄建立之後，確保新會員也能寫入）
    if (marketingOptIn) {
      await recordMarketingOptIn(customerEmail);
    }

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
