/**
 * ARASTIRMA OZETI URETICISI
 *
 *   node tools/prospect/src/arastirma-ozet.mjs
 *
 * Tarama ciktilarindan yayinlanabilir TOPLU istatistik uretir ve
 * `apps/pazarlama/src/arastirma.ts` dosyasina yazar.
 *
 * ─────────────────────────────────────────────────────────────────────
 * NEDEN URETILIYOR, ELLE YAZILMIYOR
 *
 * Sayfadaki her rakamin kaynagi `out/` altindaki denetim dosyalari. O
 * dosyalar `.gitignore`da — gercek isletme verisi repoya girmiyor. Yani
 * sayfanin rakamlari elle kopyalansaydi, dogrulugunu kimse bir daha
 * kontrol edemezdi ve ilk guncellemede sessizce eskirdi.
 *
 * Bu betik araya giriyor: veri yerelde kaliyor, ondan turetilen TOPLAM
 * sayilar repoya giriyor, ve yeniden calistirinca hepsi tazeleniyor.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ISLETME ADI CIKMIYOR — bu bir kural
 *
 * Cikti yalnizca sayi ve yuzde. Tek bir isletme adi, telefonu, adresi ya
 * da alan adi yok. Yayinlanan sey "Duzce'de isletmelerin %66'sinin
 * sitesi yok" olmali, "su isletmenin sitesi yok" degil. Birincisi haber,
 * ikincisi tesir.
 *
 * Sizinti tarayicisi zaten repoya gercek ad girmesini engelliyor ama
 * kural burada da yazili olsun: bu betigi degistirirken ad alanina
 * dokunma.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const outDizin = resolve(kok, 'tools', 'prospect', 'out');

/** Sitesi OLAN isletmeler icin anlamli bulgular. */
const SITELI_BULGULAR = [
  ['erisilemedi', 'Sitesi açılmıyor'],
  ['schema_yok', 'Yapısal veri işaretlemesi yok'],
  ['harita_yok', 'Sayfada harita yok'],
  ['telefon_yok', 'Sayfada telefon numarası yok'],
  ['eski_icerik', 'İçerik eskimiş'],
  ['https_yok', 'HTTPS yok'],
  ['mobil_uyumsuz', 'Mobil uyumsuz'],
];

const SEKTOR_ADLARI = {
  insaat: 'İnşaat ve yapı',
  turizm: 'Turizm ve konaklama',
  perakende: 'Perakende',
  otomotiv: 'Otomotiv',
};

if (!existsSync(outDizin)) {
  console.error('\n  HATA: tarama çıktısı yok. Önce `npm run tara` çalıştır.\n');
  process.exit(1);
}

const kosular = readdirSync(outDizin).filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d)).sort();
if (!kosular.length) {
  console.error('\n  HATA: out/ altında tarih formatlı tarama klasörü yok.\n');
  process.exit(1);
}

const sektorler = [];
const toplam = { denetlenen: 0, sitesiz: 0, siteli: 0, bulgular: {} };
const tarihler = [];

for (const kosu of kosular) {
  const [yil, ay, gun, nis] = kosu.split('-');
  const denYol = join(outDizin, kosu, 'denetim.json');
  if (!existsSync(denYol)) continue;

  const ham = JSON.parse(readFileSync(denYol, 'utf8'));
  const kayitlar = Array.isArray(ham) ? ham : Object.values(ham);

  const sitesizler = kayitlar.filter((r) => (r.bulgular ?? []).includes('site_yok'));
  const siteliler = kayitlar.filter((r) => !(r.bulgular ?? []).includes('site_yok'));

  const bulgular = {};
  for (const [kod] of SITELI_BULGULAR) {
    const n = siteliler.filter((r) => (r.bulgular ?? []).includes(kod)).length;
    bulgular[kod] = n;
    toplam.bulgular[kod] = (toplam.bulgular[kod] ?? 0) + n;
  }

  sektorler.push({
    anahtar: nis,
    ad: SEKTOR_ADLARI[nis] ?? nis,
    denetlenen: kayitlar.length,
    sitesiz: sitesizler.length,
    siteli: siteliler.length,
    bulgular,
  });

  toplam.denetlenen += kayitlar.length;
  toplam.sitesiz += sitesizler.length;
  toplam.siteli += siteliler.length;
  tarihler.push(`${yil}-${ay}-${gun}`);
}

const yuzde = (a, b) => Number(((100 * a) / b).toFixed(1));

const cikti = {
  guncelleme: tarihler.sort().at(-1),
  ilkTarama: tarihler.sort()[0],
  sehirler: ['Düzce', 'Bolu', 'Sakarya'],
  toplam: {
    denetlenen: toplam.denetlenen,
    sitesiz: toplam.sitesiz,
    sitesizOran: yuzde(toplam.sitesiz, toplam.denetlenen),
    siteli: toplam.siteli,
  },
  sektorler: sektorler
    .map((s) => ({
      ad: s.ad,
      denetlenen: s.denetlenen,
      sitesiz: s.sitesiz,
      sitesizOran: yuzde(s.sitesiz, s.denetlenen),
    }))
    .sort((a, b) => a.sitesizOran - b.sitesizOran),
  siteliBulgular: SITELI_BULGULAR.map(([kod, ad]) => ({
    ad,
    adet: toplam.bulgular[kod],
    oran: yuzde(toplam.bulgular[kod], toplam.siteli),
  })).sort((a, b) => b.oran - a.oran),
};

const dosya = `/**
 * DÜZCE, BOLU VE SAKARYA TARAMASININ TOPLU SONUÇLARI.
 *
 * ⚠ BU DOSYA ÜRETİLİYOR — elle düzenleme.
 *   node tools/prospect/src/arastirma-ozet.mjs
 *
 * Kaynak veri \`tools/prospect/out/\` altında ve .gitignore'da: gerçek
 * işletme verisi repoya girmiyor. Buraya yalnızca ondan türetilen toplam
 * sayılar giriyor — tek bir işletme adı, telefonu veya adresi yok.
 *
 * Son üretim: ${cikti.guncelleme}
 */

export type SektorSatiri = {
  ad: string;
  denetlenen: number;
  sitesiz: number;
  sitesizOran: number;
};

export type BulguSatiri = { ad: string; adet: number; oran: number };

export const ARASTIRMA = ${JSON.stringify(cikti, null, 2)} as const;
`;

const hedef = resolve(kok, 'apps', 'pazarlama', 'src', 'arastirma.ts');
writeFileSync(hedef, dosya, 'utf8');

console.log(`
  Araştırma özeti üretildi → apps/pazarlama/src/arastirma.ts

  Tarama          : ${kosular.length} koşu · ${cikti.ilkTarama} – ${cikti.guncelleme}
  Denetlenen      : ${cikti.toplam.denetlenen}
  Sitesi yok      : ${cikti.toplam.sitesiz}  (%${cikti.toplam.sitesizOran})
  Sitesi olan     : ${cikti.toplam.siteli}

  Sektörler:
${cikti.sektorler.map((s) => `    ${s.ad.padEnd(22)} %${String(s.sitesizOran).padStart(5)}  (n=${s.denetlenen})`).join('\n')}

  Sitesi olanlar içinde:
${cikti.siteliBulgular.map((b) => `    ${b.ad.padEnd(32)} %${String(b.oran).padStart(5)}`).join('\n')}
`);
