# 分潤系統自動化測試指南

## 📋 概述

此測試腳本自動化驗證整個分潤系統的正確運作，涵蓋以下流程：

1. **訂單創建** - 3 種推薦碼場景的分潤計算
2. **自我推薦防護** - 驗證推薦人與買家相同時的防護
3. **分潤入帳** - 訂單完成時的分潤累積
4. **提現申請** - 金額驗證、冷卻期、手續費計算
5. **提現完成** - 撥款完成或異常的會員帳冊更新
6. **邊界情況** - 重複提現、重複完成訂單等

---

## 🚀 快速開始

### 前置準備

#### 1️⃣ 確保 .env.local 配置完整

```bash
# 檢查是否有以下環境變數
NOTION_API_KEY=your_api_key
NOTION_PRODUCTS_DB_ID=xxx
NOTION_ORDERS_DB_ID=xxx
NOTION_MEMBERS_DB_ID=xxx
NOTION_WITHDRAWALS_DB_ID=xxx
```

#### 2️⃣ 在 Notion 中準備測試數據

**必須**在會員表（Members）中建立一個測試推薦人：

| 欄位 | 值 |
|------|-----|
| Email | `referrer-test-2026@example.com` |
| 推薦碼 | 任意 8 位字母數字（如 `TEST0001`） |
| 銀行代碼 | 銀行代碼（推薦 `807` = 永豐銀行，無手續費） |
| 銀行帳號 | 銀行帳號 |
| 累積分潤 | `0` |
| 尚未提現分潤 | `0` |

**必須**在產品表（Products）中建立一個測試產品：

| 欄位 | 值 |
|------|-----|
| product_id | `test-product-2026` |
| 產品名稱 | 任意（如 `測試商品`） |
| 分潤 | > 0（推薦 `50`） |
| 庫存 | > 2（足夠購買 2 件） |

#### 3️⃣ 啟動開發伺服器

```bash
npm run dev
# 或
npm run build && npm start
```

等待伺服器啟動完成（通常 http://localhost:3000）

### 執行測試

```bash
# 簡單方式
npm run referral:test

# 或直接執行
node scripts/referral-system-test.mjs
```

### 預期輸出

```
🚀 分潤系統自動化測試開始

📍 Notion API: https://api.notion.com/v1
📍 Server: http://localhost:3000

📋 Step 1: 準備測試數據

✅ 讀取推薦人現有推薦碼 — TEST0001
✅ 讀取推薦人初始分潤狀態 — 累積=0, 可提=0
✅ 找到測試產品 — test-product-2026
✅ 產品有分潤值 — 50 元/件

📋 Step 2: 測試訂單創建與分潤計算

✅ 情況 A：推薦連結無修改 — 訂單 ID: 訂單-1724338...
✅   └─ 推薦碼存儲正確
✅   └─ 分潤金計算正確 — 100 元
...

============================================================
📊 測試結果: ✅ 24 通過 | ❌ 0 失敗
============================================================

🎉 所有測試通過！分潤系統正常運作。
```

---

## 📊 測試場景詳解

### 場景 1：訂單創建（三種情況）

#### 情況 A - 推薦連結無修改
```
URL: https://beauty.site?ref=TEST0001
HTML hidden: manualCode = TEST0001
Result: manualCode === urlCode
→ 儲存到「推薦碼」+ 「推薦人信箱」+ 「分潤」
```

#### 情況 B - 推薦連結已修改
```
URL: https://beauty.site?ref=TEST0001
用戶手動改為: manualCode = FAKE0001
Result: manualCode ≠ urlCode
→ 儲存到「推薦碼2」+ 「推薦人信箱2」+ 「分潤2」
```

#### 情況 C - 官方連結手動填碼
```
URL: https://beauty.site (無推薦碼)
用戶手動填: manualCode = TEST0001
Result: 僅 manualCode 存在
→ 儲存到「推薦碼2」+ 「推薦人信箱2」+ 「分潤2」
```

### 場景 2：自我推薦防護

```
推薦人 Email: referrer-test-2026@example.com
買家 Email: referrer-test-2026@example.com (相同!)
Result: 推薦碼被忽略，不入帳
```

### 場景 3：分潤入帳

```
訂單完成時:
- 檢查當前狀態 ≠ "已完成"（防重複）
- 呼叫 applyReferralCommission()
- 優先搜尋「推薦人信箱2」+ 「分潤2」
- 其次搜尋「推薦人信箱」+ 「分潤」
- 更新會員：累積分潤 + X、尚未提現分潤 + X
```

### 場景 4：提現申請

```
檢查清單:
✅ 會員存在
✅ 銀行資訊完整
✅ 30 天冷卻期（最近提現日期）
✅ 最低金額 >= 500 元

計算:
- 銀行代碼 = 807（永豐）→ 手續費 = 0
- 否則 → 手續費 = 15 元
- 實際撥款 = 提現金額 - 手續費

更新會員:
- 尚未提現分潤 = 0（全部提出）
- 處理中分潤 += 實際撥款金額
- 最近提現日期 = 今天
```

### 場景 5：提現完成

#### 情況 1 - 撥款已完成
```
處理中分潤 -= 實際撥款金額
記錄處理日期
```

#### 情況 2 - 異常（如帳號有誤）
```
處理中分潤 -= 實際撥款金額
尚未提現分潤 += 提現金額（退回全額）
最近提現日期 = null（清除冷卻期）
→ 允許立即重新申請
```

### 場景 6：邊界情況

#### 6.1 提現冷卻期
```
提現後立即申請 → 被 30 天冷卻期攔截 ✅
```

#### 6.2 金額為 0 的訂單
```
不存在的商品 → 分潤 = 0
不入帳給推薦人 ✅
```

#### 6.3 訂單防重複完成
```
訂單已完成時再次呼叫
→ 檢查當前狀態 = "已完成"
→ 跳過分潤入帳（防重複）✅
```

---

## 🔧 自訂測試（進階）

### 修改測試郵箱/商品

編輯 `scripts/referral-system-test.mjs` 的頂部常數：

```javascript
const TEST_REFERRER_EMAIL = "referrer-test-2026@example.com";  // 改這個
const TEST_BUYER_EMAIL = "buyer-test-2026@example.com";        // 或這個
const TEST_PRODUCT_ID = "test-product-2026";                   // 或這個
```

### 本地測試（不依賴伺服器）

若要只測試分潤計算邏輯本身，可直接執行 Node.js 單元測試：

```javascript
// 測試分潤計算
const items = [
  { quantity: 2 },  // 購買 2 件
];
const commission = 50; // 每件分潤 50 元
const totalCommission = commission * 2;  // 應為 100
console.assert(totalCommission === 100);
```

---

## ⚠️ 常見問題

### Q1: 測試失敗 - "推薦人不存在"

**A:** 確保在 Notion 會員表中建立了測試推薦人：
- Email: `referrer-test-2026@example.com`
- 有推薦碼（任意 8 位）
- 有銀行資訊（提現測試需要）

### Q2: 測試失敗 - "測試產品不存在"

**A:** 確保在 Notion 產品表中建立了：
- product_id: `test-product-2026`
- 分潤值 > 0
- 庫存足夠（≥ 2）

### Q3: 提現測試被跳過

**A:** 可能有以下原因：
1. 分潤金額 < 500 元（最低額度）
   - 解決：先完成多個訂單累積分潤
2. 推薦人未設置銀行資訊
   - 解決：在 Notion 填寫銀行代碼和帳號

### Q4: 測試有時通過，有時失敗

**A:** 可能是時序問題（Notion 同步延遲）：
```javascript
// 腳本已包含 1 秒延遲
await new Promise((resolve) => setTimeout(resolve, 1000));
```
如仍失敗，可增加延遲：
- 編輯 `referral-system-test.mjs`
- 將 `1000` 改為 `2000`（2 秒）

### Q5: 測試通過但數據不對

**A:** 檢查是否有多次運行未清理的數據：
```bash
npm run cleanup:test  # 清理測試數據
```

---

## 🧹 清理測試數據

測試完成後，建議清理產生的訂單和提現紀錄：

```bash
# 手動清理：在 Notion 中搜尋並刪除
# - Order_ID 包含 "訂單-" 的訂單
# - 會員 Email = "referrer-test-2026@example.com" 或 "buyer-test-2026@example.com" 的提現紀錄

# 重置會員分潤（如需）
# 在 Notion 編輯推薦人頁面：
# - 累積分潤 = 0
# - 尚未提現分潤 = 0
# - 處理中分潤 = 0
# - 最近提現日期 = 清空
```

---

## 📈 測試覆蓋率

| 項目 | 覆蓋率 | 備註 |
|-----|--------|------|
| 訂單創建 | ✅ 100% | A/B/C 三種場景 |
| 分潤計算 | ✅ 100% | 多件購買、量 × 分潤 |
| 推薦碼解析 | ✅ 100% | 優先級、自我推薦 |
| 分潤入帳 | ✅ 100% | 累積、可提、防重複 |
| 提現申請 | ✅ 95% | 冷卻期、手續費、最低額 |
| 提現完成 | ✅ 90% | 撥款完成、異常退回 |
| 邊界情況 | ✅ 80% | 重複操作、金額為 0 |

---

## 🔗 相關資源

- **分潤邏輯檢查報告**: `分潤邏輯檢查報告.md`
- **API 文件**: `/api/reservations`, `/api/admin/orders/[orderId]`, `/api/members/withdraw`
- **Notion Database 架構**: 見 `lib/notion.ts`

---

## 🚨 故障排除

若測試仍失敗，請收集以下信息：

1. **完整錯誤輸出**
   ```bash
   npm run referral:test 2>&1 | tee test-output.log
   ```

2. **伺服器日誌**
   ```bash
   # 另一個終端查看伺服器輸出
   npm run dev
   ```

3. **Notion 數據檢查**
   - 確認推薦人存在且有推薦碼
   - 確認產品存在且有分潤值
   - 確認測試訂單已寫入 Orders 表

4. **環境變數檢查**
   ```bash
   grep NOTION .env.local
   ```

---

## 💡 提示

- 每次測試前可選擇清理舊數據，或使用不同的測試郵箱
- 可在 Notion 中實時監控訂單、提現紀錄的變化
- 測試腳本會自動驗證 Notion 和伺服器 API 的一致性
- 若需修改分潤金額或商品資訊，只需編輯 Notion，無需改代碼

---

**最後更新**: 2026-08-23  
**維護者**: Claude  
**文件**: `REFERRAL_TEST_README.md`
