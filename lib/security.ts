import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * XSS 防護：HTML 轉義
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * SQL 注入防護：檢查常見的 SQL 關鍵字
 */
export function isSuspiciousSQLInput(input: string): boolean {
  const suspiciousPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(-{2}|\/\*|\*\/|;)/g, // SQL 註釋和語句分隔符
    /(--|#|\/\*.*?\*\/)/g, // 多種註釋格式
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * 驗證電子郵件格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321
}

/**
 * 驗證 URL（防止開放重定向）
 */
export function isValidRedirectUrl(url: string, allowedOrigins: string[]): boolean {
  try {
    const parsed = new URL(url, "http://localhost");
    const origin = `${parsed.protocol}//${parsed.host}`;
    return allowedOrigins.some((allowed) => origin === allowed || allowed === "*");
  } catch {
    return false;
  }
}

/**
 * 生成 CSRF 令牌
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * 驗證 CSRF 令牌
 */
export function verifyCsrfToken(
  token: string | null,
  sessionToken: string
): boolean {
  if (!token) return false;
  return token === sessionToken;
}

/**
 * 清理用戶輸入：移除危險字符
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>\"']/g, ""); // 移除 HTML 特殊字符
}

/**
 * 驗證請求來源
 */
export function validateOrigin(
  request: NextRequest,
  allowedOrigins: string[]
): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // 允許無 Origin 的請求（如非瀏覽器客戶端）

  return allowedOrigins.includes(origin) || allowedOrigins.includes("*");
}

/**
 * 安全的中間件包裝
 */
export function withSecurityHeaders(handler: any) {
  return async (request: NextRequest) => {
    const response = await handler(request);

    // 添加安全頭部
    const newResponse = new Response(response.body, response);

    // XSS 防護
    newResponse.headers.set("X-Content-Type-Options", "nosniff");
    newResponse.headers.set("X-Frame-Options", "DENY");
    newResponse.headers.set("X-XSS-Protection", "1; mode=block");

    // CSRF 防護
    newResponse.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    );

    // 點擊劫持防護
    newResponse.headers.set("X-Permitted-Cross-Domain-Policies", "none");

    // 禁用 MIME 類型猜測
    newResponse.headers.set("X-Content-Type-Options", "nosniff");

    // 隱藏伺服器信息
    newResponse.headers.delete("Server");
    newResponse.headers.set("Server", "Secure");

    return newResponse;
  };
}

/**
 * 驗證請求的 Content-Type
 */
export function validateContentType(
  request: NextRequest,
  allowedTypes: string[]
): boolean {
  const contentType = request.headers.get("content-type");
  if (!contentType) return true;

  return allowedTypes.some((type) => contentType.includes(type));
}

/**
 * 防止路徑遍歷攻擊
 */
export function isPathTraversalAttempt(path: string): boolean {
  // 檢查 ../ 或 ..\ 模式
  return /\.\.[\/\\]/.test(path) || /^\/\.\./.test(path);
}
