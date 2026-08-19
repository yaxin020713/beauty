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
