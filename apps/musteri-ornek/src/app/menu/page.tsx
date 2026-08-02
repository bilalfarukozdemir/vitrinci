import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { KonumIkonu, SohbetIkonu, TelefonIkonu } from '@/components/Ikon';
import { Menu } from '@/components/Menu';

import { SITE } from '@/site';

/**
 * QR MENU SAYFASI.
 *
 * Masadaki QR kodun isaret ettigi yer. Ana sayfadan AYRI olmasinin
 * sebebi kullanim ani: telefonu okutan insan zaten restoranda oturuyor.
 * Hero, "bize ulasin", galeri, yorumlar — hicbirine ihtiyaci yok, hepsi
 * onu aradigi seyden uzaklastiriyor. Burada sadece menu var.
 *
 * Ust cubuk yapiskan: uzun menude asagi inerken hangi mekanda oldugunu
 * ve geri donus yolunu kaybetmiyorsun.
 *
 * Marka token'lari [slug]/layout.tsx'ten geliyor — bu sayfa da demonun
 * kendi renkleriyle boyaniyor, ayrica bir sey yapmiyoruz.
 */

export function generateMetadata(): Metadata {
  return { title: `Menü — ${SITE.isletme.ad}` };
}

export default function MenuSayfasi() {
  const demo = SITE;
  if (!demo.menu) notFound();

  const { isletme, menu } = demo;
  const adres = isletme.adresler[0];
  const tel = isletme.iletisim.telefon;
  const wa = isletme.iletisim.whatsapp?.replace(/\D/g, '');

  return (
    <main className="menu-sayfa">
      <header className="menu-tepe">
        <div className="sar">
          <a className="menu-geri" href="/">
            ← {isletme.ad}
          </a>
          {adres?.ilce && <span className="menu-yer">{adres.ilce}</span>}
        </div>
      </header>

      <div className="sar">
        <h1>Menü</h1>
        <Menu menu={menu} tam />

        <div className="menu-alt">
          {tel && (
            <a className="dugme dugme-ana" href={`tel:${tel.replace(/\s/g, '')}`}>
              <TelefonIkonu /> Ara
            </a>
          )}
          {wa && (
            <a
              className="dugme dugme-ikincil"
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SohbetIkonu /> WhatsApp
            </a>
          )}
          {adres?.mapsUrl && (
            <a
              className="dugme dugme-ikincil"
              href={adres.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <KonumIkonu /> Yol tarifi
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
