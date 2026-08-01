/**
 * Search Console export okuyucu.
 *
 *   node tools/gsc/oku.mjs               → veri/gsc altındaki tüm siteler
 *   node tools/gsc/oku.mjs <site-adi>    → tek site
 *
 * Ne yapıyor: sorguları NIYETE göre ayırıyor.
 *
 * Sebep: bir sitenin çok gösterim alması iyi haber DEĞİL — hangi aramadan
 * aldığı önemli. "andezit nedir" arayan biri Düzce'de taş ustası aramıyor;
 * "düzce parke taşı fiyatları" arayan arıyor. İkisini aynı toplamda görürsen
 * yanlış yorumlarsın.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoKok = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const gscKok = resolve(repoKok, 'veri', 'gsc');

/** Ticari niyet: para ödemeye hazır arama. */
const TICARI = /fiyat|firma|usta|yaptir|yaptır|servis|siparis|sipariş|satin|satın|kirala|nerede yaptir|en iyi|onerilen|önerilen|\bsite\b|sitesi/i;
/** Bilgi amaçli: ogrenmek isteyen. Musteri degil (henuz). */
const BILGI = /nedir|ne demek|nasil|nasıl|ozellik|özellik|nerede bulunur|cografya|coğrafya|anlami|anlamı|kac |kaç /i;

function csvOku(yol) {
  const s = readFileSync(yol, 'utf8').replace(/^﻿/, '');
  const satirlar = [];
  let alan = '', satir = [], tirnak = false;

  for (let i = 0; i < s.length; i++) {
    const k = s[i];
    if (tirnak) {
      if (k === '"') { if (s[i + 1] === '"') { alan += '"'; i++; } else tirnak = false; } else alan += k;
    } else if (k === '"') tirnak = true;
    else if (k === ',') { satir.push(alan); alan = ''; }
    else if (k === '\r') { /* yut */ }
    else if (k === '\n') { satir.push(alan); satirlar.push(satir); satir = []; alan = ''; }
    else alan += k;
  }
  if (alan || satir.length) { satir.push(alan); satirlar.push(satir); }

  const [basliklar, ...geri] = satirlar.filter((x) => x.length > 1);
  return geri.map((x) => Object.fromEntries(basliklar.map((b, i) => [b, x[i]])));
}

function siteOku(ad) {
  const dizin = resolve(gscKok, ad);
  const sorguYolu = resolve(dizin, 'Sorgular.csv');
  if (!existsSync(sorguYolu)) return null;

  const sorgular = csvOku(sorguYolu).map((x) => ({
    sorgu: x['En çok yapılan sorgular'] ?? x['Top queries'] ?? '',
    tiklama: Number(x['Tıklamalar'] ?? x['Clicks'] ?? 0),
    gosterim: Number(x['Gösterimler'] ?? x['Impressions'] ?? 0),
    pozisyon: Number(x['Pozisyon'] ?? x['Position'] ?? 0),
  }));

  const grafikYolu = resolve(dizin, 'Grafik.csv');
  const gunler = existsSync(grafikYolu)
    ? csvOku(grafikYolu).map((x) => ({
        tarih: x['Tarih'] ?? x['Date'],
        gosterim: Number(x['Gösterimler'] ?? x['Impressions'] ?? 0),
      }))
    : [];

  return { ad, sorgular, gunler };
}

const sinifla = (s) => (TICARI.test(s) ? 'ticari' : BILGI.test(s) ? 'bilgi' : 'diğer');

function raporla({ ad, sorgular, gunler }) {
  const T = (dizi, alan) => dizi.reduce((a, x) => a + x[alan], 0);

  console.log(`\n${'═'.repeat(72)}\n  ${ad}\n${'═'.repeat(72)}`);
  console.log(`  ${sorgular.length} sorgu · ${T(sorgular, 'gosterim')} gösterim · ${T(sorgular, 'tiklama')} tıklama`);
  if (gunler.length) console.log(`  Dönem: ${gunler[0]?.tarih} → ${gunler.at(-1)?.tarih} (${gunler.length} gün)`);

  const gruplar = { ticari: [], bilgi: [], diğer: [] };
  for (const s of sorgular) gruplar[sinifla(s.sorgu)].push(s);

  console.log('\n  NİYET DAĞILIMI');
  for (const [k, liste] of Object.entries(gruplar)) {
    if (!liste.length) continue;
    const g = T(liste, 'gosterim'), t = T(liste, 'tiklama');
    const pay = ((g / T(sorgular, 'gosterim')) * 100).toFixed(0);
    console.log(`    ${k.padEnd(7)} ${String(liste.length).padStart(3)} sorgu · ${String(g).padStart(4)} gösterim (%${pay}) · ${t} tıklama`);
  }

  const ticari = gruplar.ticari.sort((a, b) => a.pozisyon - b.pozisyon);
  if (ticari.length) {
    console.log('\n  TİCARİ NİYETLİ SORGULAR (para ödeyecek arama)');
    for (const s of ticari.slice(0, 12)) {
      console.log(`    ${s.pozisyon.toFixed(1).padStart(5)}. sıra  ${String(s.gosterim).padStart(4)} gös  ${String(s.tiklama).padStart(3)} tık   ${s.sorgu}`);
    }
  }

  const hacimli = [...sorgular].sort((a, b) => b.gosterim - a.gosterim).slice(0, 5);
  console.log('\n  EN ÇOK GÖSTERİM ALANLAR');
  for (const s of hacimli) {
    console.log(`    ${String(s.gosterim).padStart(4)} gös  ${s.pozisyon.toFixed(1).padStart(5)}. sıra  ${String(s.tiklama).padStart(3)} tık  [${sinifla(s.sorgu)}]  ${s.sorgu}`);
  }

  // Yayinlanabilir metrik onerisi: ticari niyetli VE ilk 5'te olanlar.
  const yayina = ticari.filter((s) => s.pozisyon <= 5);
  console.log('\n  SİTEYE KOYULABİLİR (ticari niyetli + ilk 5 sıra)');
  if (!yayina.length) {
    console.log('    Yok. Ticari sorgularda henüz ilk 5\'te değilsin.');
  } else {
    for (const s of yayina) {
      console.log(`      { etiket: '“${s.sorgu}”', deger: '${Math.round(s.pozisyon)}. sıra' },`);
    }
  }

  const toplamGos = T(sorgular, 'gosterim');
  if (toplamGos < 1000) {
    console.log(`\n  ! Toplam ${toplamGos} gösterim — TRAFİK İDDİASI İÇİN ÇOK AZ.`);
    console.log('    Sıra iddiası kullanılabilir, gösterim/tıklama rakamı kullanılamaz.');
  }
}

const istenen = process.argv[2];
const siteler = istenen
  ? [istenen]
  : existsSync(gscKok)
    ? readdirSync(gscKok, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
    : [];

let bulundu = 0;
for (const ad of siteler) {
  const veri = siteOku(ad);
  if (!veri) continue;
  raporla(veri);
  bulundu++;
}

if (!bulundu) {
  console.log(`
  veri/gsc altında Sorgular.csv bulunamadı.

  Search Console → Performans → Sağ üstten "Dışa aktar" → CSV indir,
  zipten çıkan Sorgular.csv dosyasını şuraya koy:

      veri/gsc/<site-adi>/Sorgular.csv

  \`veri/\` .gitignore'da — dışarıdan gelen ham veri repoya girmiyor.
  Ayrıntı: SETUP.md → "Search Console verisi".
`);
}
console.log('');
