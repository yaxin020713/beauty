// 產生並下載一張適合 IG 限時動態（9:16）的品牌分享圖。
// 圖片本身不含連結文字——連結要靠使用者在 IG 裡另外貼上「連結」貼圖，
// 所以圖片下方預留一個提示框，引導使用者把連結貼圖放在那個位置。

const WIDTH = 1080;
const HEIGHT = 1920;

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

function drawStoryCanvas(ctx: CanvasRenderingContext2D) {
  // 背景漸層（sapphire-950 -> ink）
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#0F141F");
  gradient.addColorStop(1, "#1A1A1A");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "center";

  // 品牌字
  ctx.fillStyle = "#D8D0AF";
  ctx.font = "600 34px Georgia, serif";
  ctx.fillText("V E S P E R ' S   V A N I T Y", WIDTH / 2, 220);

  // 裝飾線
  ctx.strokeStyle = "#C9BD90";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 70, 270);
  ctx.lineTo(WIDTH / 2 + 70, 270);
  ctx.stroke();

  // 主標題
  ctx.fillStyle = "#FBFAF9";
  ctx.font = "bold 96px Georgia, 'Noto Serif TC', serif";
  ctx.fillText("私人梳妝台的", WIDTH / 2, 760);
  ctx.fillText("專屬邀請", WIDTH / 2, 880);

  // 副標
  ctx.fillStyle = "#BEB7A7";
  ctx.font = "400 42px 'Noto Sans TC', sans-serif";
  ctx.fillText("點擊下方連結", WIDTH / 2, 980);
  ctx.fillText("解鎖你的專屬好禮", WIDTH / 2, 1040);

  // 連結貼圖提示框
  const boxWidth = 640;
  const boxHeight = 220;
  const boxLeft = (WIDTH - boxWidth) / 2;
  const boxTop = 1300;

  ctx.setLineDash([14, 10]);
  ctx.strokeStyle = "#C9BD90";
  ctx.lineWidth = 3;
  roundRect(ctx, boxLeft, boxTop, boxWidth, boxHeight, 24);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#D8D0AF";
  ctx.font = "500 38px 'Noto Sans TC', sans-serif";
  ctx.fillText("👇 在這裡新增連結貼圖", WIDTH / 2, boxTop + boxHeight / 2 + 14);

  // 底部標語
  ctx.fillStyle = "#7B715B";
  ctx.font = "400 28px 'Noto Sans TC', sans-serif";
  ctx.fillText("私人精選 · 專屬分潤", WIDTH / 2, HEIGHT - 120);
}

async function generateStoryShareImageBlob(): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  drawStoryCanvas(ctx);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/** 產生分享圖並觸發瀏覽器下載；成功回傳 true，產生失敗回傳 false */
export async function downloadStoryShareImage(): Promise<boolean> {
  const blob = await generateStoryShareImageBlob();
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
