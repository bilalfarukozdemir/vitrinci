import type { MetadataRoute } from 'next';

/**
 * Demo sitesi HICBIR ZAMAN indekslenmiyor.
 *
 * Ustundeki veri Maps'ten geliyor ve isletme tarafindan dogrulanmadi;
 * baskasinin isletmesi hakkinda dogrulanmamis iddialarin arama sonuclarina
 * dusmesi kabul edilemez. Sayfa bazinda robots meta etiketi de ayni seyi
 * soyluyor — iki katmanli bariyer.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: ['/'] }] };
}
