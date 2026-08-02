import type { MetadataRoute } from 'next';

import { baglamOlustur, sitemapUret, type SayfaTanimi } from '@studio/seo';

import { SITE } from '@/site';

/**
 * `indekslenebilir` false ise BOS doner — alan adi baglanmadan once
 * gecici Vercel adresi indekslenmesin diye.
 *
 * SAYFA LISTESI ELLE VERILIYOR, kasitli.
 *
 * `sayfaTanimlari(isletme)` verideki her hizmet icin bir hizmet sayfasi,
 * ayrica /sss /hakkinda /iletisim uretiyor. Bu site TEK SAYFA: sadece /
 * ve /menu var. Varsayilani kullansaydik sitemap sekiz adres bildirir,
 * altisi 404 verirdi — Search Console'da dogrudan hata olarak gorunur.
 * Provada tam olarak bu cikti.
 *
 * Cok sayfali bir musteri sitesi yapildiginda burasi
 * `sayfaTanimlari(SITE.isletme)` olur.
 */
const SAYFALAR: SayfaTanimi[] = [
  { sayfa: { tur: 'anasayfa' }, oncelik: 1.0, siklik: 'weekly' },
];

if (SITE.menu) {
  SAYFALAR.push({ sayfa: { tur: 'sabit', segment: 'menu' }, oncelik: 0.8, siklik: 'monthly' });
}

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapUret(SITE.isletme, baglamOlustur(SITE.isletme), {
    sonGuncelleme: new Date().toISOString().slice(0, 10),
    sayfalar: SAYFALAR,
  });
}
