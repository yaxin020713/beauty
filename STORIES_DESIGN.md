# 限時動態（Stories）功能設計文檔

## 1. 功能概述

限時動態是一個 24 小時內自動刪除的動態分享功能，支持：
- 圖片/視頻上傳
- 文字描述
- 用戶互動（點贊、評論）
- 觀看統計
- 分享功能

---

## 2. 資料庫設計

### Notion 數據庫結構

**2.1 Stories 表（限時動態主表）**

| 欄位名 | 類型 | 說明 |
|-------|------|------|
| ID | Title | 動態 ID (UUID) |
| Creator_ID | Relation | 發布者（用戶 ID） |
| Creator_Name | Rollup | 發布者名稱 |
| Content_Type | Select | 內容類型：圖片/視頻/混合 |
| Description | Rich Text | 文字描述 |
| Media_URLs | Multi-Select | 媒體 URL 列表（JSON 格式） |
| Visibility | Select | 可見性：公開/好友/指定用戶/VIP |
| Visible_To | Relation | 指定可見的用戶 |
| Created_At | Date | 創建時間 |
| Expires_At | Date | 過期時間（創建時間 + 24h） |
| View_Count | Number | 觀看次數 |
| Like_Count | Number | 點贊次數 |
| Comment_Count | Number | 評論次數 |
| Viewers | Relation | 觀看過的用戶列表 |
| Is_Expired | Checkbox | 是否已過期 |
| Video_Thumbnail | File | 視頻縮圖 |

**2.2 Story_Comments 表（評論）**

| 欄位名 | 類型 | 說明 |
|-------|------|------|
| ID | Title | 評論 ID |
| Story_ID | Relation | 所屬動態 |
| Author_ID | Relation | 發布者 ID |
| Author_Name | Rollup | 發布者名稱 |
| Content | Rich Text | 評論內容 |
| Created_At | Date | 創建時間 |
| Likes | Number | 評論點贊數 |
| Is_Deleted | Checkbox | 是否已刪除 |

**2.3 Story_Likes 表（點贊記錄）**

| 欄位名 | 類型 | 說明 |
|-------|------|------|
| ID | Title | 點贊 ID |
| Story_ID | Relation | 動態 ID |
| User_ID | Relation | 用戶 ID |
| Liked_At | Date | 點贊時間 |

**2.4 Story_Views 表（觀看記錄）**

| 欄位名 | 類型 | 說明 |
|-------|------|------|
| ID | Title | 觀看記錄 ID |
| Story_ID | Relation | 動態 ID |
| Viewer_ID | Relation | 觀看者 ID |
| Viewed_At | Date | 觀看時間 |
| Duration_Seconds | Number | 觀看時長（秒） |

---

## 3. 文件存儲設計

### 3.1 文件結構

```
/public/stories/
  ├── {story_id}/
  │   ├── original/
  │   │   ├── image_001.jpg (原始圖片)
  │   │   ├── image_002.jpg
  │   │   └── video_001.mp4 (原始視頻)
  │   ├── optimized/
  │   │   ├── image_001_600w.jpg (Web 優化版)
  │   │   ├── image_001_300w.jpg (縮圖)
  │   │   └── video_001_720p.mp4 (視頻優化版)
  │   └── metadata.json
  └── ...
```

### 3.2 媒體 URL 格式

在 Notion 中存儲為 JSON 陣列：

```json
[
  {
    "type": "image",
    "id": "media_001",
    "originalUrl": "https://beauty.site/stories/{story_id}/original/image_001.jpg",
    "optimizedUrl": "https://beauty.site/stories/{story_id}/optimized/image_001_600w.jpg",
    "thumbnailUrl": "https://beauty.site/stories/{story_id}/optimized/image_001_300w.jpg",
    "width": 1080,
    "height": 1920,
    "uploadedAt": "2026-10-01T12:00:00Z"
  },
  {
    "type": "video",
    "id": "media_002",
    "originalUrl": "https://beauty.site/stories/{story_id}/original/video_001.mp4",
    "optimizedUrl": "https://beauty.site/stories/{story_id}/optimized/video_001_720p.mp4",
    "thumbnailUrl": "https://beauty.site/stories/{story_id}/optimized/video_001_thumb.jpg",
    "duration": 15,
    "uploadedAt": "2026-10-01T12:05:00Z"
  }
]
```

---

## 4. API 端點設計

### 4.1 上傳動態

```http
POST /api/stories/create
Content-Type: multipart/form-data

{
  "description": "新產品上市！",
  "visibility": "public",
  "visibleTo": [], // 如果 visibility 是 "specific_users"
  "media": [file1, file2, ...] // 最多 10 個文件
}

Response: 201 Created
{
  "success": true,
  "storyId": "story_abc123",
  "expiresAt": "2026-10-02T12:00:00Z"
}
```

### 4.2 獲取動態列表

```http
GET /api/stories?limit=20&cursor=null

Response: 200 OK
{
  "stories": [
    {
      "id": "story_001",
      "creator": { "id": "user_001", "name": "Vesper", "avatar": "..." },
      "description": "新品發布",
      "media": [{ type: "image", url: "...", ... }],
      "viewCount": 150,
      "likeCount": 45,
      "commentCount": 12,
      "isLiked": false,
      "isViewed": true,
      "expiresAt": "2026-10-02T12:00:00Z",
      "createdAt": "2026-10-01T12:00:00Z"
    }
  ],
  "nextCursor": "story_abc123",
  "hasMore": true
}
```

### 4.3 查看動態詳情

```http
GET /api/stories/{storyId}

Response: 200 OK
{
  "id": "story_001",
  "creator": {...},
  "media": [...],
  "description": "...",
  "viewCount": 150,
  "likeCount": 45,
  "comments": [
    {
      "id": "comment_001",
      "author": { "id": "user_002", "name": "Alice" },
      "content": "太棒了！",
      "likeCount": 3,
      "createdAt": "2026-10-01T13:00:00Z"
    }
  ],
  "viewers": [
    { "id": "user_002", "name": "Alice", "viewedAt": "2026-10-01T13:00:00Z" }
  ],
  "isLiked": false,
  "isViewed": true
}
```

### 4.4 點贊動態

```http
POST /api/stories/{storyId}/like
Body: {}

Response: 200 OK
{
  "success": true,
  "likeCount": 46,
  "isLiked": true
}
```

### 4.5 發表評論

```http
POST /api/stories/{storyId}/comments
Body: {
  "content": "太棒了！"
}

Response: 201 Created
{
  "id": "comment_001",
  "author": { "id": "user_001", "name": "Me" },
  "content": "太棒了！",
  "likeCount": 0,
  "createdAt": "2026-10-01T14:00:00Z"
}
```

### 4.6 分享動態

```http
POST /api/stories/{storyId}/share
Body: {
  "platform": "whatsapp", // 或 facebook, twitter, copy_link
  "message": "快來看這個新產品！"
}

Response: 200 OK
{
  "success": true,
  "shareUrl": "https://beauty.site/stories/share/story_abc123",
  "shareMessage": "快來看這個新產品！\nhttps://beauty.site/stories/share/story_abc123"
}
```

---

## 5. 前端組件設計

### 5.1 Stories 列表視圖

```tsx
// 水平滑動的故事條
<StoriesBar>
  <StoryAvatar user={user1} /> {/* 點擊進入該用戶的故事 */}
  <StoryAvatar user={user2} />
  ...
</StoriesBar>

// Stories 信息流
<StoriesFeed>
  <StoryCard story={story} onLike={handleLike} onComment={handleComment} />
  <StoryCard story={story} />
</StoriesFeed>
```

### 5.2 Stories 查看器（全屏）

```tsx
<StoryViewer 
  story={story}
  onClose={handleClose}
  onLike={handleLike}
  onComment={handleComment}
  onShare={handleShare}
/>
```

功能：
- 全屏展示媒體
- 進度條（顯示還剩多少時間）
- 點贊按鈕
- 評論區域
- 分享按鈕
- 觀看者列表
- 下一個/上一個故事導航

### 5.3 上傳對話框

```tsx
<StoryUploadDialog>
  <MediaUploadArea maxFiles={10} maxSize={100MB} />
  <TextInput placeholder="加入文字描述..." />
  <VisibilitySelector />
  <PublishButton />
</StoryUploadDialog>
```

---

## 6. 過期和清理機制

### 6.1 自動過期清理

```typescript
// cron job：每小時執行一次
0 * * * * node scripts/cleanup-expired-stories.mjs
```

**cleanup-expired-stories.mjs**：
1. 查詢所有 `Expires_At < 現在` 的故事
2. 標記為已過期
3. 刪除對應的媒體文件
4. 清理相關的評論、點贊、觀看記錄
5. 保留統計數據（用於分析）

### 6.2 手動刪除

用戶可以隨時刪除自己的故事：
```http
DELETE /api/stories/{storyId}
```

---

## 7. 安全和隱私考慮

### 7.1 可見性控制

```typescript
enum Visibility {
  PUBLIC = "public",           // 所有用戶
  FRIENDS_ONLY = "friends",    // 僅好友
  SPECIFIC_USERS = "specific", // 指定用戶
  VIP_ONLY = "vip",           // 僅 VIP 用戶
  PRIVATE = "private"         // 僅自己
}
```

### 7.2 權限檢查

在獲取故事前檢查：
```typescript
function canViewStory(story, currentUser) {
  if (story.creator_id === currentUser.id) return true;
  
  if (story.visibility === "public") return true;
  if (story.visibility === "private") return false;
  
  if (story.visibility === "vip" && currentUser.membershipLevel === "vip") {
    return true;
  }
  
  if (story.visibility === "friends") {
    return isFriend(currentUser.id, story.creator_id);
  }
  
  if (story.visibility === "specific") {
    return story.visibleTo.includes(currentUser.id);
  }
  
  return false;
}
```

### 7.3 防止濫用

- 限制上傳頻率（每分鐘最多 1 個故事）
- 限制上傳文件大小（總計最多 100MB）
- 評論內容審核（檢測垃圾、不當內容）
- 舉報機制（用戶可舉報不當內容）

---

## 8. 效能優化

### 8.1 圖片優化

使用 Next.js Image 組件和多種尺寸：
```typescript
// 縮圖：300x540px (WebP)
// Web 版：600x1080px (WebP)
// 完整版：1080x1920px (JPEG)
```

### 8.2 媒體加載策略

```typescript
// 首頁：只加載縮圖
// 進入故事：加載優化版
// 放大：加載原始版
```

### 8.3 快取策略

```typescript
// 縮圖：快取 7 天
// 優化版：快取 30 天
// 原始版：快取 1 年（故事過期後刪除）
```

---

## 9. 業務指標

追蹤以下指標：
- 故事創建數
- 總觀看數
- 平均觀看時長
- 點贊率
- 評論率
- 分享率
- 用戶留存率

---

## 10. 實裝優先級

**第 1 期（MVP）**：
- [ ] 上傳單張圖片
- [ ] 查看故事列表
- [ ] 點贊
- [ ] 自動過期（24h）

**第 2 期**：
- [ ] 支持視頻
- [ ] 評論功能
- [ ] 觀看統計

**第 3 期**：
- [ ] 分享功能
- [ ] 可見性控制
- [ ] 分析儀表板

**第 4 期**：
- [ ] 故事購物鏈接
- [ ] AR 濾鏡
- [ ] 進階分析
