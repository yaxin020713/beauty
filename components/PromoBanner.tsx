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

  return (
    <section aria-label="促銷活動" className="relative w-full overflow-hidden bg-ivory-50">
      {/* 手機版：圖片獨立區塊在上，文字在下 */}
      <div className="sm:hidden">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-taupe-100">
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
        </div>
        <div className="px-4 py-6">
          <BannerCopy
            title={title}
            promoText={promoText}
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
          />
        </div>
      </div>

      {/* 桌面版：文字疊在圖片左側，漸層與圖片底色融合 */}
      <div className="relative hidden aspect-[21/9] w-full sm:block">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-champagne-100 via-taupe-100 to-sapphire-100" />
        )}

        {/* 淺色漸層遮罩，銜接圖片底色並確保文字清晰 */}
        <div className="absolute inset-0 bg-gradient-to-r from-ivory-50 via-ivory-50/85 to-transparent" />

        <div className="relative flex h-full w-full items-center">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="max-w-md">
              <BannerCopy
                title={title}
                promoText={promoText}
                ctaLabel={ctaLabel}
                ctaHref={ctaHref}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BannerCopy({
  title,
  promoText,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  promoText: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <>
      <p className="font-serif text-xs font-medium uppercase tracking-[0.15em] text-sapphire-600">
        Vesper&apos;s Beauty Cabinet
      </p>
      <h2 className="mt-2 font-serif text-2xl font-light text-ink sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm text-taupe-600 sm:text-base">{promoText}</p>
      <a
        href={ctaHref}
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-navy-800 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-navy-900"
      >
        {ctaLabel}
      </a>
    </>
  );
}
