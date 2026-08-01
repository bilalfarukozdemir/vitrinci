import { Archivo } from 'next/font/google';

import './globals.css';

// Tek aile, agirlikla kurulan hiyerarsi. latin-ext Turkce icin sart.
const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-govde',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={archivo.variable}>
      <body>
        {children}
        {/*
          Demo linki gonderilen kisi sayfayi ACTI MI?

          Bu olmadan iki farkli basarisizligi ayirt edemiyoruz: linke hic
          tiklanmadi (mesaj sorunu) mu, yoksa acilip begenilmedi (demo
          sorunu) mu? Cozumleri taban tabana zit, tahminle ilerlemek
          aylar kaybettirir.

          Her demonun adresi tahmin edilemez bir jeton tasidigi icin
          gorunum sayisi dogrudan "su prospect acti" demek.

          Cerezsiz — KVKK/GDPR icin onay bandi gerekmiyor, ki zaten
          demolarda boyle bir bant sayfayi bozardi.

          NEDEN <Analytics /> BILESENI DEGIL: paket ortami yanlis algilayip
          betigi hic enjekte etmiyordu. window.va tanimlaniyor, olay kuyruga
          giriyor, ama script etiketi DOM'a hic eklenmiyor — dolayisiyla tek
          bir istek bile gitmiyor. Gercek Chrome'da ag isteklerini dinleyerek
          dogrulandi. Betigi dogrudan koymak paketin ortam tahminini devre
          disi birakiyor; adres zaten paketin uretim modunda kullandigi adres.
        */}
        <script src="/_vercel/insights/script.js" defer />
      </body>
    </html>
  );
}
