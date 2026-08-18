# 會員推薦碼系統 - 快速開始

這個系統已經集成到你現有的 **members** 數據庫，無需額外創建表格。

## ✅ 已完成設置

- ✅ Members DB 已配置 (ID: `3c0df88eee9780e6a7a5000cf6bda67c`)
- ✅ 推薦碼字段: `推薦碼` (文字)
- ✅ 推薦人字段: `推薦人信箱` (文字)
- ✅ 獎勵字段: `累積返利` (數字)
- ✅ 所有 API 已實裝

## 📱 使用流程

### 會員側

1. **登入** → 點擊右上角邮箱进入個人中心 (`/account`)
2. **查看推薦碼** → 自動生成的 8 位碼，例如 `A1B2C3D4`
3. **分享** → 一鍵分享到 WhatsApp 或 LINE
   - 會自動生成分享鏈接: `https://beauty.site?ref=A1B2C3D4`

### 新用户側

1. **點擊分享鏈接** → 推薦碼自動保存到瀏覽器
2. **瀏覽商品** → 正常瀏覽網站
3. **首次下單** → 系統自動識別推薦碼並記錄
4. **下單完成** → 推薦人立即獲得 **NT$50 返利**

## 🔧 API 端點

### 1. 生成推薦碼
```bash
POST /api/referral/generate
Body: { "email": "user@example.com" }

Response:
{
  "success": true,
  "email": "user@example.com",
  "referralCode": "A1B2C3D4",
  "totalReward": 150,  # 累積返利
  "referralLink": "https://beauty.site?ref=A1B2C3D4"
}
```

### 2. 驗證推薦碼
```bash
POST /api/referral/validate
Body: { "referralCode": "A1B2C3D4" }

Response:
{
  "success": true,
  "referralCode": "A1B2C3D4",
  "referrerEmail": "referrer@example.com",
  "valid": true
}
```

### 3. 記錄推薦獎勵
```bash
POST /api/referral/track
Body: {
  "referralCode": "A1B2C3D4",
  "customerEmail": "customer@example.com",
  "orderId": "訂單-1692345600000",
  "rewardAmount": 50
}

Response:
{
  "success": true,
  "isNewCustomer": true,
  "message": "推薦成功！推薦人獲得 $50 NTD 獎勵"
}
```

## 📊 Members 表字段對應

| 顯示名稱 | 字段名 | 類型 | 說明 |
|---------|--------|------|------|
| 推薦碼 | 推薦碼 | 文字 | 會員的唯一推薦碼 |
| 推薦人信箱 | 推薦人信箱 | 文字 | 推薦者的邮箱 |
| 累積返利 | 累積返利 | 數字 | 已獲得的返利金額 |

## 🚀 核心特性

✨ **自動識別新會員**
- 系統只獎勵首次下單的新會員
- 同一會員重複下單不重複計算

🔗 **自動推薦追踪**
- URL 中的 `?ref=` 參數自動保存
- 瀏覽器關閉後仍然有效

💰 **即時獎勵發放**
- 新會員確認下單後，推薦人立即獲得 NT$50 返利
- 獎勵自動累加到累積返利字段

📱 **社交分享**
- WhatsApp 一鍵分享
- LINE 一鍵分享
- 自動生成美化的分享文案

## 🎯 推薦碼生成算法

推薦碼格式: `A1B2C3D4` (8位字符)

組成部分:
- 郵箱 hash（3位）
- 隨機數（4位）
- 時間戳（36進制）
- 取最後 8 位，轉大寫

特點:
- ✅ 唯一性保證（時間 + 隨機）
- ✅ 易於記憶和分享
- ✅ 隱私保護（郵箱被 hash）

## 📝 環境變數

已在 `.env.local` 中配置:

```env
NOTION_MEMBERS_DB_ID=3c0df88eee9780e6a7a5000cf6bda67c
NEXT_PUBLIC_SITE_URL=https://beauty.site
```

## 🐛 測試推薦流程

### 本地測試

1. 登入測試會員帳號
2. 進入 `/account` 查看推薦碼
3. 複製推薦鏈接
4. 新增另一個瀏覽器標籤頁，粘貼鏈接
5. 在新標籤頁點擊「購物車」並下單
6. 查看原會員的「累積返利」是否增加 NT$50

### API 測試

使用 curl 測試：

```bash
# 測試生成推薦碼
curl -X POST http://localhost:3000/api/referral/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 測試驗證推薦碼
curl -X POST http://localhost:3000/api/referral/validate \
  -H "Content-Type: application/json" \
  -d '{"referralCode":"A1B2C3D4"}'

# 測試記錄推薦
curl -X POST http://localhost:3000/api/referral/track \
  -H "Content-Type: application/json" \
  -d '{
    "referralCode":"A1B2C3D4",
    "customerEmail":"customer@example.com",
    "orderId":"訂單-123456",
    "rewardAmount":50
  }'
```

## 📈 後續優化建議

1. **推薦排行榜**
   - 添加排行榜頁面，展示推薦人數排名

2. **分層獎勵**
   - 推薦 5+ 人：加倍返利
   - 推薦 10+ 人：額外禮品券

3. **推薦歷史**
   - 添加「推薦歷史」表，記錄每次推薦詳情
   - 展示推薦人列表和下單情況

4. **自動結算**
   - 定期將返利轉入會員帳戶
   - 支持返利兌換商品

5. **行銷整合**
   - 推薦成功時發送郵件通知
   - 推薦人首次獲得返利時發送禮品碼

## 💡 常見問題

**Q: 推薦碼會過期嗎？**
A: 不會。推薦碼永久有效，綁定會員郵箱。

**Q: 如何修改推薦碼？**
A: 目前不支持修改。若需更換，可在 Notion 中手動編輯。

**Q: 推薦人可以獲得多少次獎勵？**
A: 無限制。每成功推薦一位新會員，即獲得 NT$50。

**Q: 同一設備下單多次會重複計算嗎？**
A: 不會。系統通過郵箱判斷是否為新會員，郵箱相同則不重複獎勵。

**Q: 如何查看推薦統計？**
A: 在個人中心 (`/account`) 可查看累積返利。詳細推薦歷史可在 Notion members 表中查看。

## 📞 故障排除

**推薦碼無法生成**
- 檢查是否登入
- 查看瀏覽器控制台錯誤信息
- 確認 Notion API Key 有效

**推薦關係未被記錄**
- 確認新會員使用了正確的推薦碼
- 檢查新會員郵箱是否正確
- 查看 `/api/referral/track` 的響應日誌

**推薦鏈接不生效**
- 確認 `NEXT_PUBLIC_SITE_URL` 配置正確
- 清除瀏覽器 localStorage（`referralCode` 鍵）
- 使用無痕瀏覽窗口測試
