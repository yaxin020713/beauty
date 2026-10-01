import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// 驗證管理員 Token
function validateAdminToken(request: NextRequest): boolean {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const adminToken = process.env.ADMIN_MONITORING_TOKEN;

  if (!adminToken) {
    console.warn("未設置 ADMIN_MONITORING_TOKEN");
    return false;
  }

  return token === adminToken;
}

export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return NextResponse.json(
      { error: "未授權的訪問" },
      { status: 401 }
    );
  }

  const type = request.nextUrl.searchParams.get("type");

  if (type === "errors") {
    // 返回錯誤統計
    const stats = logger.getErrorStats();
    return NextResponse.json(stats);
  }

  if (type === "logs") {
    // 返回最近的日誌
    const limit = parseInt(
      request.nextUrl.searchParams.get("limit") || "100"
    );
    const logs = logger.getRecentLogs(limit);
    return NextResponse.json({
      count: logs.length,
      logs,
    });
  }

  if (type === "export") {
    // 匯出所有日誌
    const data = logger.exportLogs();
    return NextResponse.json(data);
  }

  // 默認：系統健康狀態
  const logs = logger.getRecentLogs(5);
  const stats = logger.getErrorStats();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    monitoring: {
      recentLogs: logs,
      errorStats: stats,
      systemHealth: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    },
  });
}
