import type { IsletmeTaslak } from '@studio/data';

import { bolgeSlugu } from './metadata.ts';
import { dilAlternatifleri, kanonik, type RotaBaglami, type SayfaTuru } from './rotalar.ts';

/** Next.js `MetadataRoute.Sitemap` ile yapisal olarak uyumlu. */
export type SitemapKaydi = {
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: { languages: Record<string, string> };
};

export type SayfaTanimi = {
  sayfa: SayfaTuru;
  oncelik: number;
  siklik: SitemapKaydi['changeFrequency'];
};

/**
 * Sitemap'e girecek sayfalarin listesi.
 *
 * Dikkat: hizmet verilen her bolge icin sayfa ACMIYORUZ — sadece
 * `sayfaAc: true` olanlar. 40 ilce icin otomatik 40 ince sayfa uretmek
 * Google'in "doorway page" tanimina giriyor ve ceza riski tasiyor.
 * Bolge sayfasi ancak o bolgeye ozgu gercek icerik varsa acilir.
 */
export function sayfaTanimlari(isletme: IsletmeTaslak): SayfaTanimi[] {
  const tanimlar: SayfaTanimi[] = [
    { sayfa: { tur: 'anasayfa' }, oncelik: 1.0, siklik: 'weekly' },
  ];

  for (const hizmet of isletme.hizmetler) {
    tanimlar.push({ sayfa: { tur: 'hizmet', slug: hizmet.slug }, oncelik: 0.9, siklik: 'monthly' });
  }

  for (const bolge of isletme.hizmetVerilenBolgeler.filter((b) => b.sayfaAc)) {
    tanimlar.push({ sayfa: { tur: 'bolge', slug: bolgeSlugu(bolge) }, oncelik: 0.7, siklik: 'monthly' });
  }

  if (isletme.galeri.length) {
    tanimlar.push({ sayfa: { tur: 'sabit', segment: 'galeri' }, oncelik: 0.6, siklik: 'monthly' });
  }
  if (isletme.sss.length) {
    tanimlar.push({ sayfa: { tur: 'sabit', segment: 'sss' }, oncelik: 0.5, siklik: 'yearly' });
  }

  tanimlar.push(
    { sayfa: { tur: 'sabit', segment: 'hakkinda' }, oncelik: 0.5, siklik: 'yearly' },
    { sayfa: { tur: 'sabit', segment: 'iletisim' }, oncelik: 0.6, siklik: 'yearly' },
  );

  return tanimlar;
}

/**
 * Butun diller x butun sayfalar icin sitemap.
 * Indekslenebilir degilse BOS doner — demo siteleri sitemap yayinlamamali.
 *
 * `sayfalar` NEDEN VAR:
 *
 * `sayfaTanimlari` sitenin sayfalarini VERIDEN turetiyor — dort hizmet
 * varsa dort hizmet sayfasi. Ama bir sayfanin GERCEKTEN yayinlaniyor
 * olmasi verinin degil UYGULAMANIN ozelligi. Tek sayfalik musteri
 * sitesinde bu ayrim aciga cikti: sitemap sekiz adres bildiriyordu,
 * uygulamada iki tane vardi. Kalan alti adres Google'a 404 olarak
 * gidecekti — sitemap'te 404, Search Console'da dogrudan hata.
 *
 * Bu yuzden hangi sayfalarin var oldugunu UYGULAMA soyluyor. Cok
 * sayfali site `sayfaTanimlari(isletme)` sonucunu aynen gecer.
 */
export function sitemapUret(
  isletme: IsletmeTaslak,
  baglam: RotaBaglami,
  secenekler: { sonGuncelleme?: string; sayfalar?: SayfaTanimi[] } = {},
): SitemapKaydi[] {
  if (!isletme.seo.indekslenebilir) return [];

  const kayitlar: SitemapKaydi[] = [];

  for (const { sayfa, oncelik, siklik } of secenekler.sayfalar ?? sayfaTanimlari(isletme)) {
    for (const dil of baglam.destekliDiller) {
      kayitlar.push({
        url: kanonik(sayfa, dil, baglam),
        lastModified: secenekler.sonGuncelleme,
        changeFrequency: siklik,
        priority: oncelik,
        alternates: { languages: dilAlternatifleri(sayfa, baglam) },
      });
    }
  }

  return kayitlar;
}

export type RobotsKurallari = {
  rules: { userAgent: string; allow?: string[]; disallow?: string[] }[];
  sitemap?: string;
  host?: string;
};

/**
 * robots.txt.
 *
 * Demo asamasinda (indekslenebilir = false) her seyi kapatiyor. Bu, dogrulanmamis
 * musteri verisinin Google'a dusmesini engelleyen ikinci bariyer — birincisi
 * sayfa bazinda robots meta etiketi.
 */
export function robotsUret(isletme: IsletmeTaslak, baglam: RotaBaglami): RobotsKurallari {
  if (!isletme.seo.indekslenebilir) {
    return { rules: [{ userAgent: '*', disallow: ['/'] }] };
  }

  return {
    rules: [{ userAgent: '*', allow: ['/'], disallow: ['/api/', '/_next/'] }],
    sitemap: `https://${baglam.alanAdi}/sitemap.xml`,
    host: baglam.alanAdi,
  };
}
