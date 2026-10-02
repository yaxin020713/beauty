// 產生並下載一張適合 IG 限時動態（9:16）的品牌分享圖。
// 會自動帶入「本次檔期主打商品」的圖片／名稱／價格，以及會員自己的推薦碼（當作連結貼圖的備用文字）。
// 連結本身不會印在圖片上——使用者要在 IG 裡另外貼上「連結」貼圖，所以圖片上只留一個提示框。

const WIDTH = 1080;
const HEIGHT = 1920;
const LOGO_SRC = encodeURI("/images/Vesper's Vanity logo.png");

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
  options: { referralCode?: string; product?: FeaturedProductInfo | null }
) {
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
  ctx.fillText("VESPER'S  VANITY".split("").join(" "), WIDTH / 2, logoY + logoSize + 90);

  // 連結貼圖提示框：淺色底、深色虛線框與文字（貼上連結貼圖前的占位提示）
  const boxWidth = 580;
  const boxHeight = 90;
  const boxLeft = (WIDTH - boxWidth) / 2;
  const boxTop = logoY + logoSize + 150;
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
  ctx.fillText("這是我的專屬推薦連結", WIDTH / 2, headlineY);
  ctx.fillText("快來一起下單最優惠商品", WIDTH / 2, headlineY + 80);

  // 主打商品卡片
  const product = options.product;
  if (product) {
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
      } catch {
        // 圖片載入失敗就留白卡片，不影響其餘內容產生
      }
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
  }

  // 推薦碼備用文字（連結貼圖萬一沒對好、或朋友截圖保存時仍看得到）
  if (options.referralCode) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `500 30px ${fonts.sans}`;
    ctx.fillText(`輸入我的推薦碼：${options.referralCode}`, WIDTH / 2, HEIGHT - 170);
  }

  // 底部標語
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `400 26px ${fonts.sans}`;
  ctx.fillText(
    `© ${new Date().getFullYear()} Vesper's Vanity. All Rights Reserved.`,
    WIDTH / 2,
    HEIGHT - 80
  );
}

async function generateStoryShareImageBlob(options: {
  referralCode?: string;
  product?: FeaturedProductInfo | null;
}): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (document.fonts?.ready) {
    await document.fonts.ready.catch(() => {});
  }

  await drawStoryCanvas(ctx, options);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/** 產生分享圖並觸發瀏覽器下載；成功回傳 true，產生失敗回傳 false */
export async function downloadStoryShareImage(options: {
  referralCode?: string;
  product?: FeaturedProductInfo | null;
}): Promise<boolean> {
  const blob = await generateStoryShareImageBlob(options);
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "vespers-vanity-story.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return true;
}
