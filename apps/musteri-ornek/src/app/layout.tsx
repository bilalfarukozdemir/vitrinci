import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';

import { anasayfaGrafi, anasayfaMetadata, baglamOlustur, ldMetni } from '@studio/seo';
import { markaStili } from '@studio/ui';

import { SITE } from '@/site';

import './globals.css';

const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-govde',
  display: 'swap',
});

export const metadata: Metadata = anasayfaMetadata(
  SITE.isletme,
  'tr',
  SITE.isletme.seo.alanAdi,
);

/**
 * MUSTERI SITESI KOK DUZENI.
 *
 * Demodan iki fark:
 *
 *   1. Marka token'lari BURADA basiliyor. Demoda [slug]/layout.tsx her
 *      demo icin ayri tema uretiyordu; burada tek isletme var, tema kokte.
 *   2. JSON-LD de burada. Demoda sayfa icindeydi cunku slug'a bagliydi.
 *
 * Vercel Analytics betigi BILEREK YOK: demoda "prospect linki acti mi"
 * sorusunu cevapliyordu. Musteri sitesinde bu soru anlamsiz; olcum
 * ihtiyaci varsa musterinin kendi hesabiyla, onun onayiyla kurulur.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const graf = anasayfaGrafi(SITE.isletme, 'tr', baglamOlustur(SITE.isletme));

  return (
    <html lang="tr" className={archivo.variable}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: markaStili(SITE.marka, SITE.markaKoyu) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldMetni(graf) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
