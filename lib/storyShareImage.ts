// IG 限時動態分享圖：管理員在後台針對「本次檔期主打商品」產生一次、上傳到 Cloudinary 存成固定網址，
// 之後每位會員點分享都是直接拿這張現成的圖，不用每次都在顧客的瀏覽器裡重新產生
// （避免每個顧客裝置的字體/跨網域圖片限制造成生成失敗或效果不一致）。
//
// 圖片本身不含連結文字——使用者要在 IG 裡另外貼上「連結」貼圖，所以圖片上只留一個提示框。

const WIDTH = 1080;
const HEIGHT = 1920;
const LOGO_SRC = encodeURI("/images/Vesper's Vanity logo.png");
const CLOUDINARY_CLOUD_NAME = "ugcd0jm5";
const CLOUDINARY_UPLOAD_PRESET = "beauty_products";

export type FeaturedProductInfo = {
  name: string;
  price: number;
  imageUrl: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`圖片載入失敗: ${src}`));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 讀取網站實際使用的字體（next/font 產生的 CSS 變數），讓分享圖跟網站本身的字體一致
function getBrandFontStacks(): { serif: string; sans: string } {
  if (typeof window === "undefined") {
    return { serif: "serif", sans: "sans-serif" };
  }
  const root = getComputedStyle(document.documentElement);
  const playfair = root.getPropertyValue("--font-playfair").trim();
  const notoSans = root.getPropertyValue("--font-noto-tc").trim();
  return {
    serif: [playfair, notoSans, "serif"].filter(Boolean).join(", "),
    sans: [notoSans, "sans-serif"].filter(Boolean).join(", "),
  };
}

// 從已載入的圖片取樣一個背景角落像素，讓畫布背景色跟 Logo 圖的底色完全一致，避免接縫
function samplePixelColor(img: HTMLImageElement, sampleX: number, sampleY: number): string {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = img.naturalWidth;
  sampleCanvas.height = img.naturalHeight;
  const sampleCtx = sampleCanvas.getContext("2d");
  if (!sampleCtx) return "#D9A8A2";

  sampleCtx.drawImage(img, 0, 0);
  try {
    const data = sampleCtx.getImageData(sampleX, sampleY, 1, 1).data;
    return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
  } catch {
    return "#D9A8A2";
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const chars = Array.from(text);
  const lines: string[] = [];
  let current = "";

  for (const char of chars) {
    const candidate = current + char;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function drawStoryCanvas(
  ctx: CanvasRenderingContext2D,
  product: FeaturedProductInfo
): Promise<{ productImageFailed: boolean }> {
  const fonts = getBrandFontStacks();
  const logo = await loadImage(LOGO_SRC);

  // 背景：取樣 Logo 圖角落的底色，確保跟 Logo 無縫銜接
  const bgColor = samplePixelColor(logo, 4, 4);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // 圓形 Logo
  const logoSize = 320;
  const logoX = (WIDTH - logoSize) / 2;
  const logoY = 90;
  ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

  // 品牌字（手動加空白模擬字距，避免 Safari 不支援 ctx.letterSpacing）
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `500 50px ${fonts.serif}`;
  ctx.fillText("VESPER'S  VANITY".split("").join(" "), WIDTH / 2, logoY + logoSize + 90);

  // 連結貼圖提示框：淺色底、深色虛線框與文字（貼上連結貼圖前的占位提示）
  const boxWidth = 580;
  const boxHeight = 90;
  const boxLeft = (WIDTH - boxWidth) / 2;
  const boxTop = logoY + logoSize + 270;
  const boxTextColor = "#5F5846";

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  roundRect(ctx, boxLeft, boxTop, boxWidth, boxHeight, 16);
  ctx.fill();

  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = boxTextColor;
  ctx.lineWidth = 2;
  roundRect(ctx, boxLeft, boxTop, boxWidth, boxHeight, 16);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = boxTextColor;
  ctx.font = `500 26px ${fonts.sans}`;
  ctx.fillText("請複製您的專屬連結 並新增連結貼圖放置在此", WIDTH / 2, boxTop + boxHeight / 2 + 9);

  // 標語（兩行）
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `italic 700 60px ${fonts.serif}`;
  const headlineY = boxTop + boxHeight + 130;
  ctx.fillText("這是我的專屬團購連結", WIDTH / 2, headlineY);
  ctx.fillText("快來一起下單吧", WIDTH / 2, headlineY + 80);

  // 主打商品卡片
  let productImageFailed = false;
  const cardTop = headlineY + 160;
  const cardSize = 380;
  const cardLeft = 120;

  // 白底圖片卡
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, cardLeft, cardTop, cardSize, cardSize, 28);
  ctx.fill();

  if (product.imageUrl) {
    try {
      const productImg = await loadImage(product.imageUrl);
      const padding = 24;
      const innerSize = cardSize - padding * 2;
      const scale = Math.min(
        innerSize / productImg.naturalWidth,
        innerSize / productImg.naturalHeight
      );
      const drawWidth = productImg.naturalWidth * scale;
      const drawHeight = productImg.naturalHeight * scale;
      const drawX = cardLeft + (cardSize - drawWidth) / 2;
      const drawY = cardTop + (cardSize - drawHeight) / 2;
      ctx.drawImage(productImg, drawX, drawY, drawWidth, drawHeight);
    } catch (err) {
      console.warn("[storyShareImage] 商品圖片載入失敗（可能是跨網域限制）:", err);
      productImageFailed = true;
    }
  } else {
    productImageFailed = true;
  }

  // 右側文字
  const textLeft = cardLeft + cardSize + 50;
  const textMaxWidth = WIDTH - 120 - textLeft;
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `500 28px ${fonts.sans}`;
  ctx.fillText("本次檔期：", textLeft, cardTop + 60);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 42px ${fonts.serif}`;
  const nameLines = wrapText(ctx, product.name, textMaxWidth).slice(0, 3);
  nameLines.forEach((line, idx) => {
    ctx.fillText(line, textLeft, cardTop + 120 + idx * 54);
  });

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 46px ${fonts.serif}`;
  ctx.fillText(
    `NT$${product.price.toLocaleString()}`,
    textLeft,
    cardTop + 120 + nameLines.length * 54 + 60
  );

  ctx.textAlign = "center";

  // 底部標語
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `400 26px ${fonts.sans}`;
  ctx.fillText(
    `© ${new Date().getFullYear()} Vesper's Vanity. All Rights Reserved.`,
    WIDTH / 2,
    HEIGHT - 80
  );

  return { productImageFailed };
}

/** （管理員用）產生主打商品的分享圖，回傳圖片 Blob 與「商品圖片是否嵌入失敗」 */
export async function generateFeaturedShareImageBlob(
  product: FeaturedProductInfo
): Promise<{ blob: Blob | null; productImageFailed: boolean }> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: null, productImageFailed: true };

  if (document.fonts?.ready) {
    await document.fonts.ready.catch(() => {});
  }

  const { productImageFailed } = await drawStoryCanvas(ctx, product);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });

  return { blob, productImageFailed };
}

/** （管理員用）把分享圖上傳到 Cloudinary，回傳公開網址 */
export async function uploadShareImageToCloudinary(blob: Blob): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", blob, "vespers-vanity-story.png");
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    if (!res.ok || !data.secure_url) return null;
    return data.secure_url as string;
  } catch (err) {
    console.error("[storyShareImage] 上傳分享圖失敗:", err);
    return null;
  }
}

/** （管理員用）產生主打商品分享圖並上傳，回傳網址與「商品圖片是否嵌入失敗」 */
export async function generateAndUploadFeaturedShareImage(
  product: FeaturedProductInfo
): Promise<{ url: string | null; productImageFailed: boolean }> {
  const { blob, productImageFailed } = await generateFeaturedShareImageBlob(product);
  if (!blob) return { url: null, productImageFailed: true };

  const url = await uploadShareImageToCloudinary(blob);
  return { url, productImageFailed };
}

/**
 * （會員用）分享一張已經產生好、存在固定網址上的分享圖。
 * 優先用手機原生的分享面板（可直接「儲存影像」到相簿）；不支援分享面板的瀏覽器
 * （多半是桌機）才退回用 <a href download> 直接下載真實網址（不是 blob: 網址，
 * 避免某些手機瀏覽器對 blob: 網址支援不一致、直接把原頁面導覽掉的問題）。
 */
export async function shareOrDownloadImageFromUrl(
  imageUrl: string
): Promise<"shared" | "downloaded" | "share-cancelled" | "failed"> {
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  // 嘗試走原生分享面板：需要先把圖片抓成 File 物件
  if (nav.share) {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], "vespers-vanity-story.png", { type: blob.type || "image/png" });

      if (nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file] });
          return "shared";
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            return "share-cancelled";
          }
          // 其他分享錯誤才退回下載
        }
      }
    } catch (err) {
      console.warn("[storyShareImage] 抓取分享圖以供分享面板使用失敗，改用直接下載:", err);
    }
  }

  // 退回：用真實網址觸發瀏覽器下載，不經過 JS fetch，不受跨網域限制
  try {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "vespers-vanity-story.png";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return "downloaded";
  } catch (err) {
    console.error("[storyShareImage] 下載分享圖失敗:", err);
    return "failed";
  }
}
