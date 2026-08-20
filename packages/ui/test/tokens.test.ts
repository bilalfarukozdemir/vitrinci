import { test } from 'node:test';
import assert from 'node:assert/strict';

import { markaSemasi, type Marka } from '@studio/data';

import { markaTokenlari, markaStili } from '../src/index.ts';

// ---------------------------------------------------------------- fikstürler

const acikMarka: Marka = markaSemasi.parse({
  renkler: { ana: '#b04a2f', vurgu: '#e0793f', arkaplan: '#ffffff', yuzey: '#f6f6f4', metin: '#12141a' },
  kose: 'yumusak',
  ton: 'kurumsal',
});

const koyuMarka: Marka = markaSemasi.parse({
  renkler: { ana: '#b04a2f', arkaplan: '#0b0d12', yuzey: '#1a1e26', metin: '#edeef2' },
  kose: 'yuvarlak',
  ton: 'premium',
});

// ---------------------------------------------------------------- markaTokenlari

test('markaTokenlari: temel renkler doğrudan renkler alanından geliyor', () => {
  const t = markaTokenlari(acikMarka);
  assert.match(t, /--marka-ana: #b04a2f;/);
  assert.match(t, /--marka-arkaplan: #ffffff;/);
  assert.match(t, /--marka-metin: #12141a;/);
});

test('markaTokenlari: vurgu verilmezse ana renge düşüyor', () => {
  const vurgusuz = markaSemasi.parse({ renkler: { ana: '#204060' } });
  const t = markaTokenlari(vurgusuz);
  assert.match(t, /--marka-vurgu: #204060;/);
});

test('markaTokenlari: renk verilmezse açık/koyu temaya göre makul varsayılana düşüyor', () => {
  const cıplak = markaSemasi.parse({ renkler: { ana: '#204060' } });

  const acik = markaTokenlari(cıplak);
  assert.match(acik, /--marka-arkaplan: #ffffff;/);
  assert.match(acik, /--marka-metin: #12141a;/);

  const koyu = markaTokenlari(cıplak, { koyu: true });
  assert.match(koyu, /--marka-arkaplan: #0b0d12;/);
  assert.match(koyu, /--marka-metin: #edeef2;/);
});

test('vitrin: her iki temada da koyu kalıyor — fotoğraflar açık zeminde soluk kalır', () => {
  // Bkz. tokens.ts'deki yorum: vitrin şeridi telefonla çekilmiş Google Places
  // fotoğraflarının zemini, bilerek her iki temada da koyu tutuluyor.
  const acikTema = markaTokenlari(acikMarka);
  assert.match(acikTema, /--marka-vitrin: #12141a;/, 'açık temada vitrin = metin (koyu) olmalı');
  assert.match(acikTema, /--marka-vitrin-metin: #ffffff;/, 'vitrin üstü yazı = arkaplan (açık) olmalı');

  const koyuTema = markaTokenlari(koyuMarka, { koyu: true });
  assert.match(koyuTema, /--marka-vitrin: #1a1e26;/, 'koyu temada vitrin = yüzey (zaten koyu) olmalı');
  assert.match(koyuTema, /--marka-vitrin-metin: #edeef2;/, 'vitrin üstü yazı = metin (açık) olmalı');
});

test('köşe yarıçapı: kose alanı doğru CSS değerine eşleniyor', () => {
  const keskin = markaSemasi.parse({ renkler: { ana: '#000' }, kose: 'keskin' });
  const yumusak = markaSemasi.parse({ renkler: { ana: '#000' }, kose: 'yumusak' });
  const yuvarlak = markaSemasi.parse({ renkler: { ana: '#000' }, kose: 'yuvarlak' });

  assert.match(markaTokenlari(keskin), /--marka-kose: 0px;/);
  assert.match(markaTokenlari(yumusak), /--marka-kose: 10px;/);
  assert.match(markaTokenlari(yuvarlak), /--marka-kose: 999px;/);
});

test('ritim: ton alanı doğru bosluk çarpanına eşleniyor', () => {
  const premium = markaSemasi.parse({ renkler: { ana: '#000' }, ton: 'premium' });
  const teknik = markaSemasi.parse({ renkler: { ana: '#000' }, ton: 'teknik' });

  assert.match(markaTokenlari(premium), /--marka-ritim: 1\.15;/);
  assert.match(markaTokenlari(teknik), /--marka-ritim: 0\.95;/);
});

test('yazı tipi satırları sadece verildiğinde çıkıyor', () => {
  const fontsuz = markaSemasi.parse({ renkler: { ana: '#000' } });
  assert.ok(!markaTokenlari(fontsuz).includes('--marka-baslik-font'));

  const fontlu = markaSemasi.parse({
    renkler: { ana: '#000' },
    yaziTipi: { baslik: 'Playfair Display', govde: 'Inter' },
  });
  const t = markaTokenlari(fontlu);
  assert.match(t, /--marka-baslik-font: Playfair Display;/);
  assert.match(t, /--marka-govde-font: Inter;/);
});

// ---------------------------------------------------------------- markaStili

test('markaStili: koyu marka verilmezse sadece :root bloğu üretiyor', () => {
  const stil = markaStili(acikMarka);
  assert.match(stil, /^:root \{/);
  assert.ok(!stil.includes('prefers-color-scheme'));
  assert.ok(!stil.includes('data-tema'));
});

test('markaStili: koyu marka verilince sistem tercihi + elle seçim blokları geliyor', () => {
  const stil = markaStili(acikMarka, koyuMarka);

  assert.ok(stil.includes('@media (prefers-color-scheme: dark)'));
  assert.ok(stil.includes(':root[data-tema="koyu"]'));
  assert.ok(stil.includes(':root[data-tema="acik"]'));
});

test('markaStili: data-tema="acik" elle seçimi, sistem koyu tercih etse bile açık markayı zorluyor', () => {
  // Kullanıcı manuel "açık" seçtiğinde koyuMarka'nın token'ları değil,
  // orijinal (açık) marka'nın token'ları basılmalı.
  const stil = markaStili(acikMarka, koyuMarka);
  const acikBlok = stil.split(':root[data-tema="acik"]')[1]!;

  assert.match(acikBlok, /--marka-arkaplan: #ffffff;/);
  assert.ok(!acikBlok.includes('#0b0d12'), 'açık seçimde koyu marka arkaplanı sızmamalı');
});
