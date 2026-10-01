import { NextRequest } from "next/server";
import { logger } from "./logger";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * 簡單的記憶體中速率限制器
 * 在生產環境中應該使用 Redis
 */
class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // 定期清理過期的條目（每 5 分鐘）
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * 檢查請求是否超過限制
   */
  isLimited(identifier: string): { limited: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // 新的時間窗口
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { limited: false, remaining: this.maxRequests - 1 };
    }

    entry.count++;

    if (entry.count > this.maxRequests) {
      logger.warn(`速率限制觸發`, {
        identifier,
        requests: entry.count,
        limit: this.maxRequests,
      });
      return { limited: true, remaining: 0 };
    }

    return { limited: false, remaining: this.maxRequests - entry.count };
  }

  /**
   * 清理過期的條目
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * 銷毀定時器
   */
  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

export const rateLimiter = new RateLimiter(
  15 * 60 * 1000, // 15 分鐘窗口
  100 // 最多 100 個請求
);

/**
 * 獲取用戶的唯一標識符
 */
export function getClientIdentifier(request: NextRequest): string {
  // 優先使用用戶 ID（如果有身份驗證）
  const userId = (request as any).__userId;
  if (userId) {
    return `user:${userId}`;
  }

  // 否則使用 IP 地址
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `ip:${ip}`;
}

/**
 * 速率限制中間件
 */
export function withRateLimit(maxRequests?: number) {
  return (handler: any) => {
    return async (request: NextRequest) => {
      const identifier = getClientIdentifier(request);
      const { limited, remaining } = rateLimiter.isLimited(identifier);

      if (limited) {
        logger.warn(`請求被速率限制`, { identifier });
        return new Response(
          JSON.stringify({
            error: "太多請求，請稍後再試",
            retryAfter: 60,
          }),
          {
            status: 429, // Too Many Requests
            headers: {
              "Retry-After": "60",
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }

      const response = await handler(request);

      // 在響應中添加速率限制信息
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
      newResponse.headers.set("X-RateLimit-Limit", "100");

      return newResponse;
    };
  };
}
