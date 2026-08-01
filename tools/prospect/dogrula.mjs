/**
 * Mevcut tarama ciktisi uzerinde filtreleri dener. API kotasi HARCAMAZ.
 *
 * Amac: eleme kaliplarini degistirdiginde neyin elendigini — ve daha onemlisi
 * neyin YANLISLIKLA elendigini — yeni tarama yapmadan gormek.
 *
 * Kullanim: node tools/prospect/dogrula.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';

import { NISLER, SKOR } from './src/config.mjs';
import { sosyalMedyaMi, hostCikar, elemeSebebi } from './src/places.mjs';

// Motorun kullandigi eleme fonksiyonunun TA KENDISI. Kopyalamiyoruz —
// kopyalasak zamanla ayrisir ve bu betik yalan soylemeye baslar.
// Tur bilgisi eski CSV'de yok, o yuzden burada sadece ad kaliplari test ediliyor.
const nis = NISLER.insaat;
const elenirMi = (ad) => elemeSebebi({ displayName: { text: ad ?? '' }, types: [] }, nis) !== null;

// Hangi tarama klasoru? Argüman verilmezse en yeni gercek tarama secilir.
const kok = 'tools/prospect/out';
const hedef =
  process.argv[2] ??
  readdirSync(kok, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'kuru')
    .map((d) => d.name)
    .sort()
    .at(-1);

if (!hedef) {
  console.error(`\n  ${kok} altında tarama klasörü yok. Önce bir tarama çalıştır.\n`);
  process.exit(1);
}

console.log(`Tarama klasörü              : ${hedef}\n`);
const ham = readFileSync(`${kok}/${hedef}/prospects.csv`, 'utf8').replace(/^﻿/, '');

function csvCoz(m) {
  const satirlar = [];
  let alan = '', satir = [], tirnak = false;

  for (let i = 0; i < m.length; i++) {
    const k = m[i];
    if (tirnak) {
      if (k === '"') {
        if (m[i + 1] === '"') { alan += '"'; i++; } else tirnak = false;
      } else alan += k;
    } else if (k === '"') tirnak = true;
    else if (k === ';') { satir.push(alan); alan = ''; }
    else if (k === '\r') { /* yut */ }
    else if (k === '\n') { satir.push(alan); satirlar.push(satir); satir = []; alan = ''; }
    else alan += k;
  }
  if (alan || satir.length) { satir.push(alan); satirlar.push(satir); }
  return satirlar;
}

const [basliklar, ...satirlar] = csvCoz(ham).filter((s) => s.length > 3);
const K = satirlar.map((s) => Object.fromEntries(basliklar.map((b, i) => [b, s[i]])));

const elenen = K.filter((k) => elenirMi(k['İşletme']));

console.log('Toplam kayıt                :', K.length);
console.log('Ad kalıbıyla elenen         :', elenen.length, `(%${((elenen.length / K.length) * 100).toFixed(0)})`);
console.log('Kalan                       :', K.length - elenen.length);

const raporluElenen = K.filter((k) => k['Rapor Dosyası'] && elenirMi(k['İşletme']));
console.log('');
console.log('Raporu üretilmiş olanlardan elenen:', raporluElenen.length);
for (const k of raporluElenen) console.log('   ✂', (k['İşletme'] ?? '').slice(0, 50));

const sosyal = K.filter((k) => k['Site'] !== 'YOK' && sosyalMedyaMi(k['Site']));
console.log('');
console.log('Sosyal medya profili olanlar:', sosyal.length, '— artık ayrı bulgu, site gibi denetlenmiyor');

const alanlar = {};
for (const k of K) {
  if (k['Site'] === 'YOK' || sosyalMedyaMi(k['Site'])) continue;
  const d = hostCikar(k['Site']);
  if (d) (alanlar[d] ??= []).push(k['İşletme']);
}
const mukerrer = Object.values(alanlar).reduce((a, v) => a + Math.max(0, v.length - 1), 0);
console.log('Aynı alan adındaki mükerrer :', mukerrer, '— tekilleştirme bunları teke indirecek');

const yeniden = K
  .filter((k) => !elenirMi(k['İşletme']))
  .map((k) => {
    const y = Math.min(Number(k['Yorum']) || 0, SKOR.yorumDoygunluk);
    let c = (Math.log10(y + 1) / Math.log10(SKOR.yorumDoygunluk + 1)) * 60;
    const p = Number(k['Puan']);
    c += p >= 4.5 ? 25 : p >= 4.0 ? 20 : p >= 3.5 ? 12 : 5;
    if (k['Telefon']) c += 15;
    c = Math.min(Math.round(c), 100);

    const z = Number(k['Zayıflık']) || 0;
    const firsat = Math.round((SKOR.canlilikTabani + (1 - SKOR.canlilikTabani) * (c / 100)) * z);
    return { ...k, canlilik: c, firsat };
  })
  .sort((a, b) => b.firsat - a.firsat);

console.log('');
console.log(`=== TEMİZ LİSTENİN TEPESİ (yorum doygunluğu = ${SKOR.yorumDoygunluk}) ===`);
for (const k of yeniden.slice(0, 20)) {
  console.log(
    String(k.firsat).padStart(3),
    (String(k['Yorum']) + 'y').padStart(5),
    (k['İşletme'] ?? '').slice(0, 42).padEnd(43),
    (k['Şehir'] ?? '').padEnd(9),
    k['Site'] === 'YOK' ? 'SİTE YOK' : sosyalMedyaMi(k['Site']) ? 'sosyal medya' : 'site var',
  );
}
