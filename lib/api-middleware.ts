import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

// 生成請求 ID
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

// 記錄 API 調用
export function logApiCall(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: Record<string, any>
) {
  const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
  logger.log(level, `${method} ${path} - ${statusCode}`, {
    method,
    path,
    statusCode,
    durationMs: duration,
    ...context,
  });
}

// API 路由包裝函數（自動記錄日誌和錯誤）
export function withApiLogging(handler: any) {
  return async (request: NextRequest) => {
    const requestId = generateRequestId();
    (global as any).__requestId = requestId;

    const startTime = Date.now();
    const method = request.method;
    const path = request.nextUrl.pathname;

    try {
      logger.info(`${method} ${path} started`, {
        requestId,
        userAgent: request.headers.get("user-agent"),
      });

      const response = await handler(request);
      const duration = Date.now() - startTime;

      logApiCall(method, path, response.status, duration, {
        requestId,
        responseTime: `${duration}ms`,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const statusCode = error instanceof Error ? 500 : 400;

      logger.error(`${method} ${path} failed`, error as Error, {
        requestId,
        duration,
      });

      logApiCall(method, path, statusCode, duration, { requestId });

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Internal server error",
          requestId,
        },
        { status: statusCode }
      );
    }
  };
}

// 驗證請求
export function validateRequest(
  body: any,
  schema: Record<string, { required: boolean; type: string }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, config] of Object.entries(schema)) {
    if (config.required && !(key in body)) {
      errors.push(`缺少必填欄位: ${key}`);
    }
    if (key in body && typeof body[key] !== config.type) {
      errors.push(`欄位 ${key} 類型不正確，應為 ${config.type}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// 請求超時保護
export function withTimeout(handler: any, timeoutMs: number = 30000) {
  return async (request: NextRequest) => {
    const timeout = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    );

    try {
      return await Promise.race([handler(request), timeout]);
    } catch (error) {
      logger.error("Request timeout", error as Error);
      return NextResponse.json(
        { error: "Request timeout" },
        { status: 504 }
      );
    }
  };
}
