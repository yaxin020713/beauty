type LogLevel = "info" | "warn" | "error" | "debug";
type LogContext = Record<string, any>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
  requestId?: string;
}

class Logger {
  private isDev = process.env.NODE_ENV === "development";
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;

  log(level: LogLevel, message: string, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      requestId: (global as any).__requestId,
    };

    // 開發環境：立即輸出
    if (this.isDev) {
      this.printLog(entry);
    }

    // 所有環境：記錄到緩衝區
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // 關鍵錯誤：立即發送告警
    if (level === "error") {
      this.alertOnError(entry);
    }
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log("error", message, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      ...context,
    });
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      this.log("debug", message, context);
    }
  }

  private printLog(entry: LogEntry) {
    const colors = {
      info: "\x1b[36m",    // 青色
      warn: "\x1b[33m",    // 黃色
      error: "\x1b[31m",   // 紅色
      debug: "\x1b[35m",   // 洋紅色
    };
    const reset = "\x1b[0m";

    const color = colors[entry.level];
    const timestamp = entry.timestamp.split("T")[1].split("Z")[0];
    console.log(
      `${color}[${entry.level.toUpperCase()}] ${timestamp}${reset} ${entry.message}`,
      entry.context ? JSON.stringify(entry.context, null, 2) : ""
    );
  }

  private async alertOnError(entry: LogEntry) {
    // 只在生產環境發送告警
    if (this.isDev) return;

    try {
      // 發送到內部監控系統（可改成 Webhook/郵件/Slack）
      await this.sendAlert(entry);
    } catch (err) {
      console.error("Failed to send alert:", err);
    }
  }

  private async sendAlert(entry: LogEntry) {
    // 這裡可以配置發送告警的方式：
    // 1. 郵件通知
    // 2. Slack Webhook
    // 3. 短信通知
    // 4. 自建的監控系統 API

    // 暫時：記錄關鍵錯誤到檔案
    const alertMessage = `
【網站告警】
時間: ${entry.timestamp}
錯誤: ${entry.message}
詳情: ${JSON.stringify(entry.context)}
`;
    console.error(alertMessage);
  }

  // 健康檢查：返回最近的日誌
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logBuffer.slice(-limit);
  }

  // 統計：錯誤數量
  getErrorStats() {
    const errors = this.logBuffer.filter((e) => e.level === "error");
    return {
      totalErrors: errors.length,
      recentErrors: errors.slice(-10),
      lastError: errors[errors.length - 1],
    };
  }

  // 清空緩衝區
  clearBuffer() {
    this.logBuffer = [];
  }

  // 匯出日誌
  exportLogs() {
    return {
      exportedAt: new Date().toISOString(),
      totalLogs: this.logBuffer.length,
      logs: this.logBuffer,
    };
  }
}

export const logger = new Logger();
