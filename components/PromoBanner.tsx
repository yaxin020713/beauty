type PromoBannerProps = {
  title?: string;
  freeShippingThreshold?: number;
  ctaLabel?: string;
  ctaHref?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export default function PromoBanner({
  title = "全館限時尊榮禮遇 ｜ 輕奢保養日",
  freeShippingThreshold = 3000,
  ctaLabel = "立即選購 ➔",
  ctaHref = "#shop",
  imageSrc,
  imageAlt = "促銷活動橫幅",
}: PromoBannerProps) {
  return (
    <section
      aria-label="促銷活動"
      className="relative aspect-[4/5] w-full overflow-hidden bg-navy-900 sm:aspect-[16/9] lg:aspect-[21/9]"
    >
      {/* 背景圖片（尚未提供時顯示品牌色漸層佔位） */}
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-sapphire-800 to-taupe-700" />
      )}

      {/* 漸層遮罩，確保文字在任何圖片上都清晰可讀 */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-950/55 to-navy-950/10" />

      {/* 文案內容 */}
      <div className="relative flex h-full w-full items-center">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="max-w-md">
            <p className="font-serif text-xs font-medium uppercase tracking-[0.15em] text-champagne-200">
              Vesper&apos;s Beauty Cabinet
            </p>
            <h2 className="mt-2 font-serif text-2xl font-light text-white sm:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-sm text-white/85 sm:text-base">
              單筆消費滿 NT${freeShippingThreshold.toLocaleString()} 即享全館免運費
            </p>
            <a
              href={ctaHref}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-navy-900 shadow-lg transition hover:bg-champagne-100"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
