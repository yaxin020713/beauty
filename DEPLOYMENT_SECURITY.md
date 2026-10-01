# 生産環境部署安全指南

## 📋 上線前檢查清單

### 1. 環境配置
- [ ] 確認所有環境變數已正確設置 (`.env.local`)
- [ ] NOTION_API_KEY 已在 Notion 中設置
- [ ] ADMIN_MONITORING_TOKEN 已設置（用於監控面板）
- [ ] NEXT_PUBLIC_SITE_URL 指向生產域名
- [ ] NODE_ENV=production

### 2. 安全檢查
```bash
# 檢查依賴安全漏洞
npm run security-audit

# 檢查依賴版本和大小
npm run check-deps

# 類型檢查
npm run lint
```

### 3. 備份設置
- [ ] 測試備份腳本是否能正常運行
```bash
npm run backup
```
- [ ] 配置定期備份 (cron job)
```bash
# 在 crontab 中添加（每天凌晨 2 點執行）
0 2 * * * cd /path/to/beauty && npm run backup
```

### 4. 監控設置
- [ ] 配置監控告警郵件或 Slack 通知
- [ ] 測試健康檢查端點
```bash
curl http://localhost:3001/api/debug/notion-health
```
- [ ] 測試監控面板
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3001/api/admin/monitoring
```

### 5. API 速率限制
- [ ] 確認速率限制已啟用 (100 請求/15分鐘)
- [ ] 在生產環境中考慮使用 Redis 代替記憶體儲存

### 6. 安全頭部
- [ ] 確認已添加安全響應頭 (X-Content-Type-Options, CSP 等)
- [ ] 測試 XSS 防護
- [ ] 測試 CSRF 保護

---

## 🚨 常見問題和解決方案

### 問題 1: Notion API 超時
**症狀**: API 請求超過 30 秒
**解決方案**:
- 檢查網路連接
- 確認 Notion Integration 權限
- 檢查資料庫大小（超大資料庫查詢較慢）
- 查看日誌: `/api/admin/monitoring?type=errors`

### 問題 2: 速率限制觸發太頻繁
**症狀**: 頻繁收到 429 錯誤
**解決方案**:
- 檢查是否有循環調用
- 考慮增加限制數量 (在 `lib/config.ts` 中調整)
- 在生產環境使用 Redis 進行分佈式限制

### 問題 3: 記憶體泄漏
**症狀**: 服務器記憶體不斷增加
**解決方案**:
- 檢查日誌緩衝區大小 (`maxBufferSize` 在 `lib/logger.ts`)
- 確認定時器和 intervals 已正確清理
- 使用 `npm audit` 檢查依賴是否有洩漏

---

## 📊 監控和告警

### 監控端點
```bash
# 基本監控狀態
GET /api/admin/monitoring
Authorization: Bearer YOUR_ADMIN_TOKEN

# 查看錯誤統計
GET /api/admin/monitoring?type=errors

# 查看最近日誌（限制 100 條）
GET /api/admin/monitoring?type=logs&limit=100

# 匯出所有日誌
GET /api/admin/monitoring?type=export
```

### 告警配置
在 `lib/logger.ts` 的 `sendAlert` 方法中配置告警方式：

**選項 1: 郵件通知**
```typescript
// 使用 nodemailer 發送郵件
const transporter = nodemailer.createTransport({...});
await transporter.sendMail({
  to: process.env.ADMIN_EMAIL,
  subject: `網站告警: ${error.message}`,
  text: alertMessage
});
```

**選項 2: Slack Webhook**
```typescript
// 發送到 Slack
await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify({ text: alertMessage })
});
```

**選項 3: 自建監控系統**
```typescript
// 發送到自建 API
await fetch('https://monitoring.example.com/alerts', {
  method: 'POST',
  body: JSON.stringify({ ...entry })
});
```

---

## 🔐 安全最佳實踐

### 1. 環境變數管理
✅ **正確做法**:
```bash
# 在 .env.local 中（永遠不要提交到 Git）
NOTION_API_KEY=ntn_xxx
ADMIN_MONITORING_TOKEN=secure_random_token
```

❌ **錯誤做法**:
```bash
# 在代碼中硬編碼密鑰
const apiKey = "ntn_xxx"; // 永遠不要這樣做！
```

### 2. 輸入驗證
所有用戶輸入必須驗證和清理：
```typescript
import { sanitizeInput, isValidEmail, isSuspiciousSQLInput } from '@/lib/security';

const email = sanitizeInput(userInput.email);
if (!isValidEmail(email)) {
  return error("無效的電子郵件");
}

if (isSuspiciousSQLInput(userInput.search)) {
  return error("包含非法字符");
}
```

### 3. HTTPS 強制
在生產環境中設置 HTTPS 重定向：
```typescript
// 在 middleware.ts 或 next.config.js 中
if (request.headers.get('x-forwarded-proto') !== 'https') {
  return NextResponse.redirect('https://...');
}
```

### 4. CORS 配置
```typescript
// 在 config.ts 中定義允許的來源
security: {
  allowedOrigins: [process.env.NEXT_PUBLIC_SITE_URL]
}
```

### 5. 定期安全審計
```bash
# 每週執行
npm run security-audit
npm run check-deps

# 每月查看日誌
npm run backup && ls -la .backups/
```

---

## 📈 效能優化

### 1. Notion API 查詢優化
```typescript
// ❌ 不好：查詢所有記錄
const all = await notion.databases.query({ database_id });

// ✅ 好：帶篩選和分頁
const filtered = await notion.databases.query({
  database_id,
  filter: { /* 限制條件 */ },
  page_size: 100,
  sorts: [{ timestamp: 'descending' }]
});
```

### 2. 日誌大小管理
日誌緩衝區有最大限制 (1000 條)，但建議定期導出和歸檔：
```bash
# 導出日誌
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/admin/monitoring?type=export > logs.json
```

### 3. CDN 和快取
配置 Next.js 的快取策略：
```typescript
// next.config.js
module.exports = {
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 年
  }
}
```

---

## 🔄 上線後維護

### 日常 (每日)
- [ ] 檢查監控面板是否有告警
- [ ] 查看最近的日誌是否有錯誤

### 每週
- [ ] 執行 `npm run security-audit`
- [ ] 檢查備份檔案大小是否異常

### 每月
- [ ] 執行 `npm run check-deps` 檢查過時依賴
- [ ] 導出和歸檔日誌
- [ ] 檢查備份是否能成功恢復

### 每季度
- [ ] 進行完整的安全審計
- [ ] 更新依賴到最新版本
- [ ] 測試災難恢復流程

---

## 📞 應急聯絡方式

發生嚴重事故時：
1. **立即停止受影響的服務** (如有必要)
2. **查看日誌** (`/api/admin/monitoring`)
3. **回滾上次備份** (使用 `/scripts/backup-notion-data.mjs`)
4. **通知客戶** (準備好預案說明)
5. **事後分析** (找出根本原因)

---

## 相關文件

- [Notion Integration 設置](./NOTION_SETUP.md)
- [API 文檔](./API_DOCS.md)
- [故障排除](./TROUBLESHOOTING.md)
