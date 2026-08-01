/**
 * QR üretecinin gidiş-dönüş testi.
 *
 * Üretilen matrisi standarda göre GERİ ÇÖZÜP girdi metnine eşit mi diye
 * bakıyor. Yakaladığı hatalar: yanlış zikzak yerleştirme, maskenin
 * yanlış uygulanması, biçim bitlerinin yanlış yere yazılması, blok
 * serpiştirmesinin bozulması — yani gerçekte olabilecek hataların hepsi.
 *
 * Yakalayamadığı: kodlayıcı ve çözücünün AYNI yanlışı yapması (ör. zikzak
 * ikisinde de aynalanmışsa ikisi de anlaşır). Ona karşı savunma, matrisin
 * bulucu/zamanlama desenlerinin standarda uyduğunu ayrıca doğrulamak ve
 * kodu gerçek bir telefonla bir kez okutmak.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { qrMatris, qrSvg } from '../src/qr.ts';

const MASKELER = [
  (y, x) => (y + x) % 2 === 0,
  (y) => y % 2 === 0,
  (_, x) => x % 3 === 0,
  (y, x) => (y + x) % 3 === 0,
  (y, x) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (y, x) => ((y * x) % 2) + ((y * x) % 3) === 0,
  (y, x) => (((y * x) % 2) + ((y * x) % 3)) % 2 === 0,
  (y, x) => (((y + x) % 2) + ((y * x) % 3)) % 2 === 0,
];

/** ECC M: [toplam, ecc/blok, [[blok, veri]…]] — üreteçle aynı tablo. */
const SURUMLER = [
  [26, 10, [[1, 16]]], [44, 16, [[1, 28]]], [70, 26, [[1, 44]]], [100, 18, [[2, 32]]],
  [134, 24, [[2, 43]]], [172, 16, [[4, 27]]], [196, 18, [[4, 31]]],
  [242, 22, [[2, 38], [2, 39]]], [292, 22, [[3, 36], [2, 37]]], [346, 26, [[4, 43], [1, 44]]],
];
const HIZALAMA = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

/** Matristen metni geri okur. */
function coz(m) {
  const n = m.length;
  const surum = (n - 17) / 4;

  // biçim bilgisi (satır 8 kopyası) → maske
  const bicim = [];
  for (let i = 0; i < 15; i++) {
    if (i < 6) bicim.push(m[8][i]);
    else if (i < 8) bicim.push(m[8][i + 1]);
    else bicim.push(m[8][n - 15 + i]);
  }
  const ham = bicim.reduce((t, b) => (t << 1) | (b ? 1 : 0), 0) ^ 0b101010000010010;
  const maske = (ham >> 10) & 0b111;
  assert.equal((ham >> 13) & 0b11, 0b00, 'ECC seviyesi M olmalı');

  // ayrılmış (işlev deseni) haritası — üreteçle aynı mantık
  const ayr = Array.from({ length: n }, () => new Array(n).fill(false));
  const isaretle = (x, y, w, h) => {
    for (let i = 0; i < h; i++) for (let j = 0; j < w; j++)
      if (ayr[y + i]?.[x + j] !== undefined) ayr[y + i][x + j] = true;
  };
  for (const [x, y] of [[0, 0], [n - 7, 0], [0, n - 7]]) isaretle(x - 1, y - 1, 9, 9);
  for (const cy of HIZALAMA[surum - 1]) for (const cx of HIZALAMA[surum - 1]) {
    if (ayr[cy]?.[cx]) continue;
    isaretle(cx - 2, cy - 2, 5, 5);
  }
  for (let i = 8; i < n - 8; i++) { ayr[6][i] = true; ayr[i][6] = true; }
  ayr[n - 8][8] = true;
  for (let i = 0; i < 9; i++) { ayr[8][i] = true; ayr[i][8] = true; }
  for (let i = 0; i < 8; i++) { ayr[8][n - 1 - i] = true; ayr[n - 1 - i][8] = true; }

  // zikzak oku + maskeyi kaldır
  const bitler = [];
  let yukari = true;
  for (let sag = n - 1; sag > 0; sag -= 2) {
    if (sag === 6) sag = 5;
    for (let adim = 0; adim < n; adim++) {
      const y = yukari ? n - 1 - adim : adim;
      for (const x of [sag, sag - 1]) {
        if (ayr[y][x]) continue;
        bitler.push(m[y][x] !== MASKELER[maske](y, x));
      }
    }
    yukari = !yukari;
  }
  const kodlar = [];
  for (let i = 0; i + 8 <= bitler.length; i += 8)
    kodlar.push(bitler.slice(i, i + 8).reduce((t, b, j) => t | ((b ? 1 : 0) << (7 - j)), 0));

  // serpiştirmeyi geri al
  const [, eccSayi, gruplar] = SURUMLER[surum - 1];
  const blokBoy = [];
  for (const [adet, boy] of gruplar) for (let i = 0; i < adet; i++) blokBoy.push(boy);
  const bloklar = blokBoy.map(() => []);
  const enUzun = Math.max(...blokBoy);
  let p = 0;
  for (let i = 0; i < enUzun; i++)
    for (let b = 0; b < bloklar.length; b++)
      if (i < blokBoy[b]) bloklar[b].push(kodlar[p++]);
  const veri = bloklar.flat();

  // mod + uzunluk + bayt
  const vb = [];
  for (const k of veri) for (let i = 7; i >= 0; i--) vb.push((k >> i) & 1);
  const al = (basla, adet) => vb.slice(basla, basla + adet).reduce((t, b) => (t << 1) | b, 0);
  assert.equal(al(0, 4), 0b0100, 'byte kipi bekleniyordu');
  const sayacBit = surum >= 10 ? 16 : 8;
  const uzunluk = al(4, sayacBit);
  const baytlar = [];
  for (let i = 0; i < uzunluk; i++) baytlar.push(al(4 + sayacBit + i * 8, 8));
  void eccSayi;
  return new TextDecoder().decode(Uint8Array.from(baytlar));
}

test('qr: kısa metin gidip geri geliyor', () => {
  const s = 'MERHABA';
  assert.equal(coz(qrMatris(s)), s);
});

// Adresler hayali ama UZUNLUKLARI gerçek demo adreslerininkiyle aynı —
// sürüm eşiği uzunlukla belirleniyor, sınanan şey o.
test('qr: tipik demo adresi gidip geri geliyor', () => {
  const s = 'https://ornek-demo.vercel.app/mese-bahce-restoran-k4p2vt/menu';
  const m = qrMatris(s);
  assert.equal(m.length, 33, 'sürüm 4 bekleniyordu');
  assert.equal(coz(m), s);
});

test('qr: en uzun demo adresi de sığıyor', () => {
  const s = 'https://ornek-demo.vercel.app/sapanca-koy-kahvaltisi-bahce-cafe-ve-restoran-x7q3md/menu';
  assert.equal(coz(qrMatris(s)), s);
});

test('qr: bulucu ve zamanlama desenleri standarda uygun', () => {
  const m = qrMatris('https://ornek-demo.vercel.app/x/menu');
  const n = m.length;
  for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
    assert.ok(m[oy].slice(ox, ox + 7).every(Boolean), 'bulucu üst kenarı dolu olmalı');
    assert.ok(m[oy + 6].slice(ox, ox + 7).every(Boolean), 'bulucu alt kenarı dolu olmalı');
    assert.equal(m[oy + 1][ox + 1], false, 'bulucu iç halkası boş olmalı');
    assert.equal(m[oy + 3][ox + 3], true, 'bulucu merkezi dolu olmalı');
  }
  for (let i = 8; i < n - 8; i++) {
    assert.equal(m[6][i], i % 2 === 0, 'yatay zamanlama deseni');
    assert.equal(m[i][6], i % 2 === 0, 'dikey zamanlama deseni');
  }
  assert.equal(m[n - 8][8], true, 'koyu modül her zaman dolu');
});

test('qr: çok uzun metin hata veriyor, sessizce bozuk kod üretmiyor', () => {
  assert.throws(() => qrMatris('a'.repeat(200)), /çok uzun/);
});

test('qr: svg beyaz zemin ve sessiz alan taşıyor', () => {
  const svg = qrSvg('https://ornek-demo.vercel.app/x/menu', { boyut: 200 });
  assert.match(svg, /<svg[^>]+width="200"/);
  assert.match(svg, /fill="#fff"/, 'beyaz zemin şart — koyu temada okunmuyor');
  // 33 modül + iki yanda 4'er sessiz alan
  assert.match(svg, /viewBox="0 0 \d+ \d+"/);
});

/*
   GERÇEK REFERANS DEĞERLERİ.

   Yukarıdaki gidiş-dönüş testi kodlayıcıyla çözücünün ANLAŞTIĞINI
   gösteriyor, DOĞRU olduğunu değil — nitekim üreteç polinomu ters
   yazılmışken hepsi geçiyordu ve QR hiçbir telefonda okunmuyordu.

   Aşağıdaki parmak izleri bağımsız bir uygulamanın (npm 'qrcode',
   ECC M) çıktısından alındı ve modül modül aynı olduğu doğrulandı.
   Bunlar dış gerçeklik; bir daha sessizce bozulamaz.

   ADRES DEĞİŞTİRİRSEN parmak izini de yeniden üretmen gerekir — ve
   bunu KENDİ üretecimizle yapma, yoksa test "kodlayıcı kendisiyle
   tutarlı" demekten öteye geçmez. Bağımsız uygulamayı kur, matrisi
   aynı biçimde (satır satır '1'/'0', '\n' ile birleştir) özetle:

     npm i qrcode
     QRCode.create(metin, { errorCorrectionLevel: 'M' })
*/
const REFERANS = [
  ['https://ornek-demo.vercel.app/x/menu', 29, 'f65e4ae398519b75'],
  ['https://ornek-demo.vercel.app/mese-bahce-restoran-k4p2vt/menu', 33, '53a2a5084a14e771'],
  ['https://ornek-demo.vercel.app/sapanca-koy-kahvaltisi-bahce-cafe-ve-restoran-x7q3md/menu', 41, '0b5d016c4f503fad'],
];

test('qr: bağımsız uygulamanın çıktısıyla birebir aynı', async () => {
  const { createHash } = await import('node:crypto');
  for (const [metin, boyut, ozet] of REFERANS) {
    const m = qrMatris(metin);
    assert.equal(m.length, boyut, metin);
    const h = createHash('sha256')
      .update(m.map((r) => r.map((v) => (v ? '1' : '0')).join('')).join('\n'))
      .digest('hex')
      .slice(0, 16);
    assert.equal(h, ozet, `referanstan sapma: ${metin}`);
  }
});
