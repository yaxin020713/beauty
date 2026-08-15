# 購物車持久化文檔

## 概覽

購物車品項現在會自動保存到瀏覽器 localStorage，用戶離開網頁後返回時可以恢復購物車內容。

## 功能特性

✅ **自動保存**：每次購物車改變時自動保存  
✅ **自動恢復**：頁面加載時自動恢復購物車  
✅ **錯誤處理**：localStorage 不可用時優雅降級  
✅ **空購物車處理**：購物車為空時不保存（節省空間）  

## 工作原理

### 1. 初始化時恢復購物車

```typescript
useEffect(() => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsedCart = JSON.parse(stored) as CartItem[];
      setCartItems(parsedCart);
    }
  } catch (error) {
    console.error("Failed to load cart from localStorage:", error);
    localStorage.removeItem(CART_STORAGE_KEY);
  }
}, []);
```

- 組件掛載時檢查 localStorage
- 如果存在購物車數據則恢復
- 如果數據損壞則清除並開始新購物車

### 2. 購物車改變時保存

```typescript
useEffect(() => {
  try {
    if (cartItems.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Failed to save cart to localStorage:", error);
  }
}, [cartItems]);
```

- 每當 `cartItems` 改變時自動保存
- 購物車為空時清除 localStorage 數據
- 異常時記錄錯誤但不中斷應用

## localStorage 鍵名

| 鍵名 | 用途 | 內容 |
|------|------|------|
| `auth_user` | 認證狀態 | 用戶 Email、角色、登入時間 |
| `cart_items` | 購物車數據 | 商品列表、數量、價格等 |

## 購物車數據格式

```typescript
type CartItem = Product & { quantity: number };

// 儲存在 localStorage 中的格式
[
  {
    id: "page-id-123",
    name: "小黑瓶精華液",
    category: "護膚",
    price: 1500,
    weight_g: 30,
    cost50: 800,
    cost100: 700,
    image: "https://...",
    description: "...",
    totalSold: 45,
    quantity: 2  // 購物車中的數量
  },
  // ... 更多商品
]
```

## 使用場景

### 場景 1：顧客添加商品後關閉標籤頁

1. 顧客添加 3 件商品到購物車
2. 關閉網頁或標籤頁
3. 購物車數據自動保存到 localStorage
4. 1 小時後顧客回到網站
5. 購物車自動恢復，仍有 3 件商品 ✅

### 場景 2：瀏覽器崩潰後恢復

1. 顧客在購物車中有多件商品
2. 瀏覽器意外崩潰或設備關機
3. 顧客重新打開瀏覽器並訪問網站
4. 購物車自動恢復 ✅

### 場景 3：登出後購物車保留

1. 顧客登入並添加商品
2. 顧客點擊登出
3. **購物車保留**（不清空）
4. 新用戶登入後可以看到舊購物車 ⚠️
   - 這是設計選擇，可根據需求修改

## 修改購物車清除行為

### 登出時清除購物車（可選）

如果要在用戶登出時清除購物車，修改 `CartContext.tsx` 中的 logout 函數：

```typescript
const logout = useCallback(() => {
  setUser(null);
  setCartItems([]);  // 添加這行
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to remove user from localStorage:", error);
  }
}, []);
```

### 結帳後清除購物車

結帳成功後自動清除（已實現）：

```typescript
// 在 CheckoutModal.tsx 中
setOrderResult({ ... });
clearCart();  // 清除購物車
```

## 瀏覽器支援

| 瀏覽器 | localStorage 支援 | 容量限制 |
|--------|------------------|--------|
| Chrome | ✅ 支援 | ~10MB |
| Firefox | ✅ 支援 | ~10MB |
| Safari | ✅ 支援 | ~5MB |
| Edge | ✅ 支援 | ~10MB |
| IE 11 | ✅ 支援 | ~10MB |

## localStorage 容量

購物車數據通常很小：
- 單件商品：~300 字節
- 10 件商品：~3KB
- 100 件商品：~30KB

**容量足夠**：即使購物車有 1000 件商品，也遠低於 10MB 限制。

## 清除購物車

### 用戶操作

1. **點擊「清空購物車」按鈕**（如果有）
   - 手動清除購物車

2. **結帳成功後**
   - 自動清除購物車

3. **點擊登出**
   - 購物車保留（可選擇修改為清除）

### 手動清除（開發者）

```typescript
import { useCart } from "@/components/CartContext";

function ClearCartButton() {
  const { clearCart } = useCart();
  return <button onClick={clearCart}>清空購物車</button>;
}
```

### 通過瀏覽器開發工具

1. 打開瀏覽器開發工具 (F12)
2. 進入 Application/Storage 標籤
3. 選擇 Local Storage
4. 找到網站域名
5. 刪除 `cart_items` 鍵

## 故障排除

### 購物車沒有持久化

**檢查項目**：
1. 瀏覽器是否允許 localStorage？
   ```javascript
   // 在開發工具控制台測試
   localStorage.setItem("test", "value");
   localStorage.getItem("test");
   ```

2. 是否處於隱私瀏覽模式？
   - 隱私模式不支持 localStorage
   - 建議用戶使用正常瀏覽模式

3. 是否超過容量限制？
   - 清除瀏覽器數據
   - 檢查其他網站是否佔用空間

### 購物車顯示舊數據

**解決方法**：
1. 打開開發工具 (F12)
2. 進入 Application/Storage
3. 刪除 `cart_items`
4. 刷新頁面

或使用 JavaScript：
```javascript
localStorage.removeItem("cart_items");
location.reload();
```

### 某些瀏覽器不支持

使用備用方案（當前實現不支持）：
- IndexedDB（更大容量）
- Session Storage（會話結束後清除）
- Cookies（容量小）

## API 集成

### 結帳時發送購物車

結帳 API 自動發送購物車內容：

```typescript
const res = await fetch("/api/orders", {
  method: "POST",
  body: JSON.stringify({
    customerName,
    customerPhone,
    paymentLast5,
    items: cartItems,  // 從 CartContext 中的購物車
  }),
});
```

### 重新導入購物車（未實現）

如果要從伺服器同步購物車（適合登入用戶）：

```typescript
// 假設伺服器有 GET /api/cart 端點
useEffect(() => {
  if (user) {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => setCartItems(data.items));
  }
}, [user]);
```

## 最佳實踐

✅ **做**：
- 使用 `useCart()` hook 管理購物車
- 讓 CartProvider 自動處理持久化
- 結帳後清除購物車
- 定期測試購物車持久化

❌ **不做**：
- 手動修改 localStorage 中的購物車數據
- 在不同網站之間共享購物車
- 在隱私模式下期望購物車持久化
- 存儲超大量商品（超過 1000 件）

## 隱私和安全

### localStorage 中的數據

⚠️ **注意**：localStorage 中的數據是**明文存儲**

**隱私考慮**：
- 任何能訪問瀏覽器的人都能看到購物車內容
- 不要在 localStorage 中存儲敏感信息（密碼、支付信息）
- 公用電腦使用後應清除瀏覽器數據

**當前實現**：
- ✅ 只存儲商品 ID、數量、價格
- ✅ 不存儲支付信息
- ✅ 不存儲個人隱私信息

## 測試購物車持久化

### 手動測試

1. 添加商品到購物車
2. 記錄購物車內容
3. 關閉瀏覽器或清除內存
4. 重新打開網頁
5. 驗證購物車是否恢復

### 開發者測試

```typescript
// 打開開發工具控制台
import { useCart } from "@/components/CartContext";

// 在組件中檢查
const { cartItems } = useCart();
console.log("Current cart:", cartItems);

// 檢查 localStorage
console.log("Stored cart:", 
  JSON.parse(localStorage.getItem("cart_items") || "[]")
);
```

## 相關文檔

- [登入系統](./AUTH.md) - 用戶認證和角色管理
- [購物車組件](./components/CartContext.tsx) - 購物車實現
- [結帳流程](./components/CheckoutModal.tsx) - 訂單提交

