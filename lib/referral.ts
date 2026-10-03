import { notion, MEMBERS_DB_ID } from "./notion";

function readRichText(prop: any): string {
  return prop?.type === "rich_text" && Array.isArray(prop.rich_text)
    ? prop.rich_text[0]?.plain_text || ""
    : "";
}

function readNumber(prop: any): number {
  return prop?.type === "number" ? prop.number || 0 : 0;
}

// 將推薦人的待實現分潤轉到待提現分潤（訂單完成時調用）
export async function moveUnrealizedCommissionToAvailable(email: string, amount: number): Promise<void> {
  if (!email || amount <= 0 || !MEMBERS_DB_ID) return;

  const referrerQuery = await notion.databases.query({
    database_id: MEMBERS_DB_ID,
    filter: {
      property: "Email",
      title: { equals: email },
    },
  });

  if (referrerQuery.results.length === 0) return;

  const referrerPage = referrerQuery.results[0];
  let currentUnrealizedCommission = 0;
  let currentAvailableCommission = 0;
  let currentTotalCommission = 0;

  if ("properties" in referrerPage) {
    const unrealizedProp = referrerPage.properties.待實現分潤;
    if (unrealizedProp && "number" in unrealizedProp && typeof unrealizedProp.number === "number") {
      currentUnrealizedCommission = unrealizedProp.number || 0;
    }

    const availableProp = referrerPage.properties.待提現分潤;
    if (availableProp && "number" in availableProp && typeof availableProp.number === "number") {
      currentAvailableCommission = availableProp.number || 0;
    }

    const totalProp = referrerPage.properties.歷史累積分潤;
    if (totalProp && "number" in totalProp && typeof totalProp.number === "number") {
      currentTotalCommission = totalProp.number || 0;
    }
  }

  // 將分潤從待實現轉到待提現，並更新歷史累積分潤（只計一次）
  await notion.pages.update({
    page_id: referrerPage.id,
    properties: {
      待實現分潤: { number: Math.max(0, currentUnrealizedCommission - amount) },
      待提現分潤: { number: currentAvailableCommission + amount },
      歷史累積分潤: { number: currentTotalCommission + amount },
    },
  });
}

// 把分潤加入待實現分潤（下單當下）：
// - 待實現分潤：已下單但訂單未完成的分潤，訂單完成 8 天後轉入待提現分潤
export async function creditUnrealizedCommission(email: string, amount: number): Promise<void> {
  if (!email || amount <= 0 || !MEMBERS_DB_ID) return;

  const referrerQuery = await notion.databases.query({
    database_id: MEMBERS_DB_ID,
    filter: {
      property: "Email",
      title: { equals: email },
    },
  });

  if (referrerQuery.results.length === 0) return;

  const referrerPage = referrerQuery.results[0];
  let currentUnrealizedCommission = 0;
  if ("properties" in referrerPage) {
    const unrealizedProp = referrerPage.properties.待實現分潤;
    if (unrealizedProp && "number" in unrealizedProp && typeof unrealizedProp.number === "number") {
      currentUnrealizedCommission = unrealizedProp.number || 0;
    }
  }

  await notion.pages.update({
    page_id: referrerPage.id,
    properties: {
      待實現分潤: { number: currentUnrealizedCommission + amount },
    },
  });
}

// 讀取訂單頁面上的分潤資訊，將待實現分潤轉為待提現分潤。
// 優先次推薦人與對應分潤金（手動修改或官方連結手動填寫），次之推薦人與對應分潤金（推薦連結自動帶入）。
// 呼叫時機：訂單狀態轉為「已完成」時（管理員手動操作或每日自動排程），
// 而非下單當下，因此呼叫端須自行確保不會對同一筆訂單重複呼叫。
export async function applyReferralCommission(orderPage: unknown): Promise<void> {
  if (!orderPage || typeof orderPage !== "object" || !("properties" in orderPage)) return;
  if (!MEMBERS_DB_ID) return;

  const props = (orderPage as { properties: Record<string, any> }).properties;

  // 優先使用次推薦人與對應分潤金（手動修改或官方連結手動填寫）
  const secondaryEmail = readRichText(props["推薦人信箱2"]);
  const secondaryCommission = readNumber(props["分潤2"]);
  if (secondaryEmail && secondaryCommission > 0) {
    await moveUnrealizedCommissionToAvailable(secondaryEmail, secondaryCommission);
    return;
  }

  // 其次使用推薦人與對應分潤金（推薦連結自動帶入）
  const primaryEmail = readRichText(props["推薦人信箱"]);
  const primaryCommission = readNumber(props["分潤"]);
  // 確保推薦人信箱存在，才進行分潤（防止孤立的分潤金額）
  if (primaryEmail && primaryCommission > 0) {
    await moveUnrealizedCommissionToAvailable(primaryEmail, primaryCommission);
  } else if (!primaryEmail && primaryCommission > 0) {
    console.warn(
      `[applyReferralCommission] 訂單有分潤金額 ${primaryCommission} 但缺少推薦人信箱，無法入帳。訂單ID: ${props.Order_ID?.title?.[0]?.plain_text}`
    );
  }
}

// 若該 email 的會員記錄尚未記錄「條款同意時間」，於下單/預訂當下補記錄同意時間。
// 讓完成會員檔案彈窗（選擇稍後再填）之外，實際下單這個無法略過的環節也能確保留下同意紀錄。
export async function recordTermsAgreementIfNeeded(email: string): Promise<void> {
  if (!email || !MEMBERS_DB_ID) return;

  try {
    const memberQuery = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: "Email",
        title: { equals: email.toLowerCase() },
      },
    });

    if (memberQuery.results.length === 0) return;

    const memberPage = memberQuery.results[0];
    if (!("properties" in memberPage)) return;

    const termsProp = memberPage.properties.條款同意時間;
    const alreadyAgreed =
      termsProp?.type === "date" && !!termsProp.date?.start;
    if (alreadyAgreed) return;

    await notion.pages.update({
      page_id: memberPage.id,
      properties: {
        條款同意時間: { date: { start: new Date().toISOString() } },
      },
    });
  } catch (err) {
    console.warn(`[recordTermsAgreementIfNeeded] 記錄條款同意時間失敗 (${email}):`, err);
  }
}

// 更新會員的行銷訂閱狀態。
// 訂閱：勾選「行銷訂閱」並把「行銷訂閱時間」更新為本次勾選的時間。
// 取消：只取消勾選，保留最後一次的訂閱時間作為紀錄。
// 回傳是否寫入成功；找不到會員或 Notion 寫入失敗都回傳 false，不拋出例外。
export async function setMarketingOptIn(email: string, optIn: boolean): Promise<boolean> {
  if (!email || !MEMBERS_DB_ID) return false;

  try {
    const memberQuery = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: "Email",
        title: { equals: email.toLowerCase() },
      },
    });

    if (memberQuery.results.length === 0) return false;

    const properties: Record<string, any> = {
      行銷訂閱: { checkbox: optIn },
    };
    if (optIn) {
      properties.行銷訂閱時間 = { date: { start: new Date().toISOString() } };
    }

    await notion.pages.update({
      page_id: memberQuery.results[0].id,
      properties,
    });
    return true;
  } catch (err) {
    console.warn(`[setMarketingOptIn] 更新行銷訂閱失敗 (${email}, optIn=${optIn}):`, err);
    return false;
  }
}

// 註冊／結帳時會員主動勾選行銷訂閱。獨立於其他欄位寫入，失敗也不影響會員資料或訂單的儲存。
export async function recordMarketingOptIn(email: string): Promise<void> {
  await setMarketingOptIn(email, true);
}

// 生成唯一的推荐码（8位字符，易于分享）
export function generateReferralCode(email: string): string {
  // 使用邮箱 hash + 随机数生成唯一码
  const timestamp = Date.now().toString(36); // 时间戳转36进制
  const emailHash = email
    .toLowerCase()
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    .toString(36)
    .slice(-3);
  const random = Math.random().toString(36).slice(-4);

  return (emailHash + random + timestamp).slice(-8).toUpperCase();
}

// 从请求推导目前实际访问的网域，避免使用未设定或错误的 NEXT_PUBLIC_SITE_URL 占位网址
export function getSiteUrlFromRequest(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  // "https://beauty.site" 是文件中示例用的占位网域，实际并不存在，视为未设定
  if (envUrl && envUrl !== "https://beauty.site") {
    return envUrl;
  }

  const host = request.headers.get("host");
  if (host) {
    const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return envUrl || "https://beauty.site";
}

// 生成推荐链接
export function generateReferralLink(referralCode: string, baseUrl: string): string {
  return `${baseUrl}?ref=${referralCode}`;
}

// 验证推荐码格式
export function isValidReferralCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code);
}

// 从 URL 提取推荐码
export function extractReferralCodeFromUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return url.searchParams.get("ref");
  } catch {
    return null;
  }
}
