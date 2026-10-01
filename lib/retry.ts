import { logger } from "./logger";

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitterFactor?: number; // 添加隨機抖動，避免雷群效應
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

/**
 * 重試函數，採用指數退避策略
 * @param fn 要重試的非同步函數
 * @param options 重試選項
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= (opts.maxRetries || 3) + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt > (opts.maxRetries || 3)) {
        logger.error(`重試失敗（第 ${attempt - 1} 次後放棄）`, lastError, {
          maxRetries: opts.maxRetries,
        });
        throw lastError;
      }

      // 計算延遲時間：指數退避 + 隨機抖動
      const exponentialDelay =
        (opts.initialDelayMs || 1000) *
        Math.pow(opts.backoffMultiplier || 2, attempt - 1);

      const jitter =
        exponentialDelay * (opts.jitterFactor || 0.1) * Math.random();
      const delayMs = Math.min(
        exponentialDelay + jitter,
        opts.maxDelayMs || 30000
      );

      logger.warn(`重試第 ${attempt} 次（${delayMs.toFixed(0)}ms 後）`, {
        error: lastError.message,
        attempt,
      });

      if (opts.onRetry) {
        opts.onRetry(attempt, lastError, delayMs);
      }

      // 等待後重試
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * 判斷錯誤是否可重試
 */
export function isRetryableError(error: any): boolean {
  // 網絡錯誤
  if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
    return true;
  }

  // HTTP 狀態碼
  const status = error.status || error.response?.status;
  if (status) {
    // 5xx 伺服器錯誤：可重試
    // 429 Too Many Requests：可重試（帶指數退避）
    // 503 Service Unavailable：可重試
    return status >= 500 || status === 429 || status === 503;
  }

  // Notion API 特定的可重試錯誤
  if (error.message?.includes("timeout") || error.message?.includes("ENOTFOUND")) {
    return true;
  }

  return false;
}

/**
 * 重試指定條件下的函數
 */
export async function retryIf<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error) => boolean = isRetryableError,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  for (let attempt = 1; attempt <= (opts.maxRetries || 3) + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const err = error as Error;

      if (!shouldRetry(err)) {
        throw err; // 不可重試的錯誤：直接拋出
      }

      if (attempt > (opts.maxRetries || 3)) {
        throw err;
      }

      const exponentialDelay =
        (opts.initialDelayMs || 1000) *
        Math.pow(opts.backoffMultiplier || 2, attempt - 1);

      const jitter =
        exponentialDelay * (opts.jitterFactor || 0.1) * Math.random();
      const delayMs = Math.min(
        exponentialDelay + jitter,
        opts.maxDelayMs || 30000
      );

      logger.warn(
        `可重試錯誤，準備第 ${attempt} 次重試（${delayMs.toFixed(0)}ms 後）`,
        {
          error: err.message,
          attempt,
        }
      );

      if (opts.onRetry) {
        opts.onRetry(attempt, err, delayMs);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("Unreachable");
}
