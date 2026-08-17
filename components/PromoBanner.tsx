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
  const promoText = `單筆消費滿 NT$${freeShippingThreshold.toLocaleString()} 即享全館免運費`;

  // 標題若含「｜」則拆成兩行呈現，第二行縮排營造錯落感；否則單行顯示
  const titleParts = title.split("｜").map((part) => part.trim()).filter(Boolean);

  return (
    <section
      aria-label="促銷活動"
      className="relative aspect-[4/3] w-full overflow-hidden bg-ivory-50 sm:aspect-[16/9] lg:aspect-[21/9]"
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-champagne-100 via-taupe-100 to-sapphire-100" />
      )}

      {/* 淺色漸層遮罩，銜接圖片底色並確保文字清晰 */}
      <div className="absolute inset-0 bg-gradient-to-r from-ivory-50 via-ivory-50/85 to-transparent" />

      <div className="relative flex h-full w-full items-center">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="max-w-[80%] sm:max-w-md">
            <p className="font-serif text-xs font-medium uppercase tracking-[0.15em] text-sapphire-600">
              Vesper&apos;s Beauty Cabinet
            </p>
            <h2 className="mt-2 font-serif text-xl font-light leading-snug text-ink sm:text-3xl lg:text-4xl">
              {titleParts.length === 2 ? (
                <>
                  <span className="block">{titleParts[0]}</span>
                  <span className="block pl-6 sm:pl-10">{titleParts[1]}</span>
                </>
              ) : (
                title
              )}
            </h2>
            <p className="mt-3 text-xs text-taupe-600 sm:text-base">{promoText}</p>
            <a
              href={ctaHref}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-navy-800 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-navy-900 sm:mt-5 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
