import { notion, MEMBERS_DB_ID } from "./notion";

// 讀取訂單頁面上已試算好的分潤資訊（推薦人信箱、分潤金額），入帳給推薦人：
// - 累積分潤：終身總額，只增不減，純粹作為歷史紀錄
// - 尚未提現分潤：目前可提現的餘額，訂單完成時增加、提現時扣減（見 /api/members/withdraw）
// 呼叫時機：訂單狀態轉為「已完成」時（管理員手動操作或每日自動排程），
// 而非下單當下，因此呼叫端須自行確保不會對同一筆訂單重複呼叫。
export async function applyReferralCommission(orderPage: unknown): Promise<void> {
  if (!orderPage || typeof orderPage !== "object" || !("properties" in orderPage)) return;
  if (!MEMBERS_DB_ID) return;

  const props = (orderPage as { properties: Record<string, any> }).properties;

  const referrerEmail =
    props["推薦人信箱"]?.type === "rich_text" && Array.isArray(props["推薦人信箱"].rich_text)
      ? props["推薦人信箱"].rich_text[0]?.plain_text || ""
      : "";
  const commission =
    props["分潤"]?.type === "number" ? props["分潤"].number || 0 : 0;

  if (!referrerEmail || commission <= 0) return;

  const referrerQuery = await notion.databases.query({
    database_id: MEMBERS_DB_ID,
    filter: {
      property: "Email",
      title: { equals: referrerEmail },
    },
  });

  if (referrerQuery.results.length === 0) return;

  const referrerPage = referrerQuery.results[0];
  let currentTotalCommission = 0;
  let currentAvailableCommission = 0;
  if ("properties" in referrerPage) {
    const totalProp = referrerPage.properties.累積分潤;
    if (totalProp && "number" in totalProp && typeof totalProp.number === "number") {
      currentTotalCommission = totalProp.number || 0;
    }

    const availableProp = referrerPage.properties.尚未提現分潤;
    if (availableProp && "number" in availableProp && typeof availableProp.number === "number") {
      currentAvailableCommission = availableProp.number || 0;
    }
  }

  await notion.pages.update({
    page_id: referrerPage.id,
    properties: {
      累積分潤: { number: currentTotalCommission + commission },
      尚未提現分潤: { number: currentAvailableCommission + commission },
    },
  });
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
