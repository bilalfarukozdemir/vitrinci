import type { NextConfig } from 'next';

/**
 * MUSTERI SITESI — demodan farki uc yerde.
 *
 *   1. Tek isletme, [slug] rotasi yok.
 *   2. Taslak seridi yok; veri musteri tarafindan dogrulandi.
 *   3. Indekslenebilir; robots ve sitemap gercek deger donuyor.
 *
 * Demo uygulamasindaki `eski-yollar.json` mekanizmasi burada YOK:
 * demo adresinden bu adrese yonlendirme demo tarafinda kuruluyor,
 * cunku kirilan link orada.
 */
const config: NextConfig = {
  transpilePackages: ['@studio/data', '@studio/seo', '@studio/ui'],
  typedRoutes: true,
  typescript: { ignoreBuildErrors: false },
};

export default config;
