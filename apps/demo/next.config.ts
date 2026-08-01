import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { NextConfig } from 'next';

/**
 * GONDERILMIS ADRESLER.
 *
 * Demo adreslerine sonradan tahmin edilemez ek (jeton) eklendi. Ek eklenmeden
 * ONCE gonderilmis linkler bu tabloda tutuluyor — prospect'in elindeki mesaj
 * olu link icermesin.
 *
 * KURAL: bir demo linki gonderildikten sonra adresi DEGISTIRME. Zorunlu
 * kalirsan eskisini tabloya ekle. Musterinin elindeki linki kirmak, o
 * musteriyi kaybetmenin en sessiz yolu.
 *
 * TABLO REPODA DEGIL — `eski-yollar.json`, .gitignore'da. Icindeki
 * slug'lar gercek isletmelerin adindan turedigi icin yayinlanamaz, ama
 * silinmesi de gerekmiyor: dosya yoksa yonlendirme listesi bos kaliyor
 * ve yeni kuran biri icin dogru davranis zaten bu.
 *
 * Bicim:  [{ "source": "/eski-slug", "destination": "/yeni-slug-a1b2c3" }]
 */
type Yonlendirme = { source: string; destination: string };

function eskiYollar(): Yonlendirme[] {
  // `next build` her zaman uygulama kokunden kosuyor; config dosyasini da
  // Next oradan cozuyor. import.meta.dirname kullanmiyoruz cunku config'in
  // ESM mi CJS mi derlendigi Next surumune gore degisiyor.
  const yol = resolve(process.cwd(), 'eski-yollar.json');
  if (!existsSync(yol)) return [];

  try {
    const icerik: unknown = JSON.parse(readFileSync(yol, 'utf8'));
    if (!Array.isArray(icerik)) throw new Error('dizi bekleniyordu');

    return icerik.map((y, i) => {
      const { source, destination } = (y ?? {}) as Partial<Yonlendirme>;
      if (typeof source !== 'string' || typeof destination !== 'string') {
        throw new Error(`${i}. kayıtta source/destination eksik`);
      }
      return { source, destination };
    });
  } catch (hata) {
    // Sessizce bos donmek yanlis olur: dosya VAR ama okunamiyorsa
    // gonderilmis linkler kirilir ve bunu kimse fark etmez.
    throw new Error(`eski-yollar.json okunamadı: ${(hata as Error).message}`);
  }
}

/*
   VERI KLASORU YOKSA ANLASILIR HATA VER.

   `src/veriler/` .gitignore'da, yani temiz bir klonda hic yok. Onceki
   surumde bu durumda `next build` ham bir webpack hatasi veriyordu —
   "Module not found: Can't resolve '@/veriler/index'" — ve hicbir sey
   `npm run ornek`i isaret etmiyordu. Sirayi atlayan kullanici orada
   kaliyordu.

   Kontrol config yuklenirken kosuyor, yani derleme baslamadan once.
*/
if (!existsSync(resolve(process.cwd(), 'src/veriler/index.ts'))) {
  throw new Error(
    '\n\n  Demo verisi bulunamadı: apps/demo/src/veriler/\n\n' +
      '  Bu klasör .gitignore\'da (içinde gerçek işletme verisi oluyor),\n' +
      '  yani temiz bir klonda yok. Örnek fikstürlerle oluştur:\n\n' +
      '      npm run ornek\n\n' +
      '  Sonra bu komutu tekrar çalıştır.\n',
  );
}

const config: NextConfig = {
  transpilePackages: ['@studio/data', '@studio/seo', '@studio/ui'],
  typedRoutes: true,
  typescript: { ignoreBuildErrors: false },

  // permanent: false (307) — kalici degil, cunku bunlar gecici koprular.
  redirects: async () => eskiYollar().map((y) => ({ ...y, permanent: false })),
};

export default config;
