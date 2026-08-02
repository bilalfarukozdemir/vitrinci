import type { MetadataRoute } from 'next';

import { baglamOlustur, robotsUret } from '@studio/seo';

import { SITE } from '@/site';

/**
 * Demoda bu dosya KOSULSUZ "disallow: /" donuyordu — dogrulanmamis veri
 * arama sonuclarina dusmesin diye.
 *
 * Musteri sitesinde karar SEMADAN geliyor: `seo.indekslenebilir`. Alan
 * adi baglanmadan once false birakilmali, yoksa gecici Vercel adresi
 * indekslenir ve sonradan temizlenmesi zor bir iz kalir.
 */
export default function robots(): MetadataRoute.Robots {
  return robotsUret(SITE.isletme, baglamOlustur(SITE.isletme));
}
