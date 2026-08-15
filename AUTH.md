# 登入系統文檔

## 概覽

該應用使用基於 Email 的簡單登入系統，區分用戶為 **管理員** 或 **顧客**。

## 用戶角色

### 👤 顧客 (Customer)
- **條件**：任何有效的 Email 地址（除了管理員 Email）
- **權限**：
  - 瀏覽商品列表
  - 加入購物車
  - 進行結帳購買
  - 查看訂單信息

### 🛡️ 管理員 (Admin)
- **條件**：Email 地址 = `yaxinzhu2002@gmail.com`（可通過環境變數修改）
- **權限**：
  - 所有顧客權限
  - 上架新商品
  - 編輯商品信息
  - 查看所有訂單
  - 管理商品分類

## 登入流程

### 1. 打開登入對話框
- 用戶點擊頁頭 "登入" 按鈕
- 登入對話框 (LoginModal) 打開

### 2. 輸入 Email
- 用戶輸入 Email 地址
- 系統驗證 Email 格式

### 3. 系統辨識身份
```
if (email === "yaxinzhu2002@gmail.com")
  → 標記為管理員 (role: "admin")
else if (email 格式有效)
  → 標記為顧客 (role: "customer")
else
  → 拒絕登入，顯示錯誤信息
```

### 4. 保存登入狀態
- 用戶信息保存到 localStorage
- 刷新頁面後仍保持登入狀態
- 用戶可點擊登出按鈕清除登入狀態

## 代碼位置

### 核心文件

| 文件 | 功能 |
|------|------|
| `components/CartContext.tsx` | AuthProvider 和 useAuth hook，管理登入狀態 |
| `components/LoginModal.tsx` | 登入表單 UI 和驗證邏輯 |
| `lib/auth.ts` | 登入工具函數 |
| `.env.example` | 環境變數配置範本 |

### 登入狀態結構

```typescript
type User = {
  email: string;           // 用戶 Email（已正規化為小寫）
  role: UserRole;          // "admin" 或 "customer"
  loginTime: number;       // 登入時間戳（毫秒）
};

enum UserRole {
  Admin = "admin",
  Customer = "customer",
}
```

## 使用登入狀態

### 在組件中獲取用戶信息

```typescript
import { useAuth } from "@/components/CartContext";

export function MyComponent() {
  const { user, isAdmin, isCustomer, login, logout } = useAuth();

  if (!user) {
    return <div>未登入</div>;
  }

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>身份: {isAdmin ? "管理員" : "顧客"}</p>
      <button onClick={logout}>登出</button>
    </div>
  );
}
```

### 條件渲染

```typescript
// 只顯示給管理員
{isAdmin && <AdminPanel />}

// 只顯示給顧客
{isCustomer && <CustomerDashboard />}

// 只顯示給未登入的用戶
{!user && <LoginButton />}
```

### 工具函數

```typescript
import {
  validateEmail,
  isValidEmail,
  getUserRole,
  isAdmin,
  isCustomer,
  getUserRoleLabel,
  getLoginTimeString,
  ADMIN_EMAIL,
} from "@/lib/auth";

// 驗證 Email 格式
validateEmail("user@example.com"); // true

// 詳細的 Email 驗證
const { valid, error } = isValidEmail("invalid-email");

// 獲取用戶角色
const role = getUserRole("user@example.com"); // "customer"

// 快速檢查角色
isAdmin("yaxinzhu2002@gmail.com"); // true
isCustomer("user@example.com");    // true

// 獲取角色標籤
getUserRoleLabel(UserRole.Admin); // "管理員"

// 格式化登入時間
getLoginTimeString(user.loginTime); // "2026/8/16 10:30:45"
```

## 環境變數配置

### 開發環境

在 `.env.local` 中設置（本機開發）：

```bash
NEXT_PUBLIC_ADMIN_EMAIL=yaxinzhu2002@gmail.com
```

### 生產環境（Vercel）

在 Vercel 項目設置中添加：

1. 進入 **Settings** → **Environment Variables**
2. 添加 `NEXT_PUBLIC_ADMIN_EMAIL`
3. 值設為管理員 Email（如：`yaxinzhu2002@gmail.com`）

### 修改管理員 Email

如果要更改管理員 Email：

1. 修改環境變數 `NEXT_PUBLIC_ADMIN_EMAIL`
2. 重新部署應用
3. 舊的管理員 Email 登入後將變為顧客

## localStorage 持久化

登入狀態會自動保存到瀏覽器 localStorage，鍵名為 `auth_user`。

### 清除登入狀態的方式

1. **點擊登出按鈕** ✅ 推薦
2. **清除瀏覽器 localStorage**
3. **清除瀏覽器 cookies**（整個網站）

## API 驗證

### 上架商品 API (`POST /api/products`)

API 會驗證 Email 和身份：

```typescript
const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "yaxinzhu2002@gmail.com";
if (email.toLowerCase() !== adminEmail.toLowerCase()) {
  return { error: "權限不足，僅限管理員上架商品", status: 403 };
}
```

**注意**：此驗證是客戶端+服務器雙重驗證。生產環境應實現更強的服務器端認證機制（如 JWT tokens）。

## 安全建議

### 當前實現

- ✅ Email 驗證
- ✅ localStorage 持久化
- ✅ 客戶端角色檢查

### 建議的改進（未來）

- ❌ 添加 JWT tokens 進行服務器認證
- ❌ 實現 Email 驗證流程（發送驗證碼）
- ❌ 添加 Session 過期時間
- ❌ 實現密碼/OAuth 認證
- ❌ 添加審計日誌

## 常見問題

**Q: 如何更改管理員 Email？**
A: 修改環境變數 `NEXT_PUBLIC_ADMIN_EMAIL` 並重新部署。

**Q: 用戶登出後信息會被刪除嗎？**
A: 是的，localStorage 中的用戶信息會被清除。

**Q: 能否設置多個管理員？**
A: 當前不支持。可以修改代碼或使用數據庫實現。

**Q: 登入信息在哪裡存儲？**
A: 存儲在瀏覽器的 localStorage 中，鍵名為 `auth_user`。

**Q: 如何在伺服器組件中獲取用戶信息？**
A: 當前版本不支持。需要使用 cookies 或 session 實現。
