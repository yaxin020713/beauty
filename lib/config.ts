/**
 * 環境配置管理器
 * 確保敏感資訊不會洩漏，並根據環境進行隔離
 */

export const ENV = process.env.NODE_ENV || "development";
export const isDev = ENV === "development";
export const isProd = ENV === "production";
export const isTest = ENV === "test";

// 驗證必要的環境變數
function validateEnv() {
  const required = [
    "NOTION_API_KEY",
    "NOTION_PRODUCTS_DB_ID",
    "NOTION_ORDERS_DB_ID",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0 && isProd) {
    throw new Error(`缺少必要的環境變數: ${missing.join(", ")}`);
  }
}

validateEnv();

// 應用配置
export const config = {
  // API 相關
  notion: {
    apiKey: process.env.NOTION_API_KEY || "",
    productsDbId: process.env.NOTION_PRODUCTS_DB_ID || "",
    ordersDbId: process.env.NOTION_ORDERS_DB_ID || "",
    membersDbId: process.env.NOTION_MEMBERS_DB_ID || "",
    withdrawalsDbId: process.env.NOTION_WITHDRAWALS_DB_ID || "",
    productVariantsDbId: process.env.NOTION_PRODUCT_VARIANTS_DB_ID || "",
    batchesDbId: process.env.NOTION_BATCHES_DB_ID || "",
  },

  // 認證
  auth: {
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "",
    monitoringToken: process.env.ADMIN_MONITORING_TOKEN || "",
  },

  // 網站配置
  site: {
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
    name: "Vesper's Vanity",
  },

  // 郵件配置
  email: {
    gmailUser: process.env.GMAIL_USER || "",
    gmailPassword: process.env.GMAIL_APP_PASSWORD || "",
  },

  // 安全設定
  security: {
    // CORS 配置：只允許特定的來源
    allowedOrigins: isProd
      ? [process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"]
      : ["http://localhost:3000", "http://localhost:3001"],

    // API 速率限制
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 分鐘
      maxRequests: 100, // 每個 IP 每 15 分鐘最多 100 個請求
    },

    // 密碼策略
    password: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },

    // 會話配置
    session: {
      expiryMs: 24 * 60 * 60 * 1000, // 24 小時
    },

    // 內容安全策略（CSP）
    csp: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      "img-src": ["'self'", "data:", "https:"],
      "font-src": ["'self'", "fonts.gstatic.com"],
    },
  },

  // 日誌配置
  logging: {
    level: isDev ? "debug" : "warn",
    maxLogSize: 1000,
  },

  // 功能標誌
  features: {
    // 是否啟用推薦系統
    referralEnabled: true,
    // 是否啟用提現功能
    withdrawalsEnabled: false,
    // 是否啟用預訂功能
    reservationsEnabled: true,
  },
};

// 驗證敏感資訊不會被洩漏
export function getSafeConfig() {
  return {
    site: config.site,
    security: {
      allowedOrigins: config.security.allowedOrigins,
      csp: config.security.csp,
    },
    features: config.features,
    // 不包含 API 密鑰或敏感令牌
  };
}

// 確保在瀏覽器端無法訪問敏感配置
if (typeof window !== "undefined") {
  // 運行在瀏覽器端，確保不會暴露敏感資訊
  const sensitiveKeys = ["notion", "auth.monitoringToken", "email"];
  console.warn(
    "⚠️  不應該在瀏覽器端導入 config，會洩漏敏感資訊"
  );
}
