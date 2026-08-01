import { test } from 'node:test';
import assert from 'node:assert/strict';

import { adayGovdeler } from '../src/alanadi.mjs';

/*
   ISIMLER HAYALI, YAPILARI GERCEK.

   Buradaki her ad gercek bir vakadan turetildi ama adin kendisi degistirildi.
   Onemli olan KELIME TURLERININ dizilisi — marka / sehir / sektor / jenerik
   ek — cunku kurallar tam olarak onu okuyor. Bir adi degistirirken ayni
   dizilisi koru, yoksa test baska bir seyi olcmeye baslar ve bunu kimse
   fark etmez.

     KAVAK DUVAR                        marka + sektor
     OZDEN TICARET                      marka + jenerik ek
     CINAR GRUP INSAAT EMLAK            marka + jenerik + sektor + sektor
     Hendek Komple Dekorasyon & Ergin Yapi  sehir + sektor + sektor + marka + sektor
     Prizma Tadilat Dekorasyon          marka + sektor + sektor
     Sapanca Bahce Peyzaj               sehir + sektor + sektor
*/

test('alan adı: firma adından gövde türetilir', () => {
  // Gercek vaka: mesaj gonderildikten SONRA iki kelimelik firma adinin
  // harfi harfine .com.tr olarak kayitli oldugu fark edildi. Bu govde
  // uretilmezse kontrol ise yaramaz.
  assert.ok(adayGovdeler('KAVAK DUVAR').includes('kavakduvar'));
  assert.ok(adayGovdeler('ÖZDEN TİCARET').includes('ozdenticaret'));
});

test('alan adı: Türkçe karakterler doğru çevrilir', () => {
  const g = adayGovdeler('Şişli Çatı Ğüneş');
  assert.ok(g.every((x) => /^[a-z0-9]+$/.test(x)), 'gövdelerde ASCII dışı karakter kalmamalı: ' + g.join(','));
  assert.ok(adayGovdeler('Ergin Yapı').includes('erginyapi'));
});

test('alan adı: jenerik ekler atılınca kısa varyant da denenir', () => {
  // "OZDEN TICARET" → hem ozdenticaret hem ozden denenmeli. Gercek vakada
  // adres bambaska bir kelimeyle kayitliydi, ikisi de tutmadi — arac bir
  // garanti degil, suzgec.
  const g = adayGovdeler('ÖZDEN TİCARET');
  assert.ok(g.includes('ozden'), 'jenerik ek atılmış varyant üretilmeli');

  const c = adayGovdeler('ÇINAR GRUP İNŞAAT EMLAK');
  assert.ok(c.includes('cinaremlak'), 'jenerik ekler atılınca cinaremlak kalmalı');
});

test('alan adı: çok kısa ve boş adlar gövde üretmez', () => {
  assert.deepEqual(adayGovdeler(''), []);
  assert.deepEqual(adayGovdeler('AŞ'), [], 'iki harflik jenerik ek tek başına alan adı olmaz');
});

test('alan adı: komşu olmayan kelime çiftleri de denenir', () => {
  // GERCEK VAKA: bu firmanin adresi <sehir><sektor>.com'du. Ilk surum
  // sadece komsu ciftleri deniyordu, birinci+ikinci kelimeyi uretip
  // birinci+UCUNCU kelimeyi kaciriyordu. Bu test o hatanin nobetcisi.
  const g = adayGovdeler('Hendek Komple Dekorasyon & Ergin Yapı');
  assert.ok(g.includes('hendekdekorasyon'), 'birinci+üçüncü kelime üretilmeli');
  assert.ok(g.includes('erginyapi'), 'son iki kelime varyantı da üretilmeli');
});

test('alan adı: şehir ve sektör kelimeleri TEK BAŞINA denenmez', () => {
  // hendek.com ya da dekorasyon.com bu isletmenin olmaz; ciftin icinde ise
  // serbest olmali. Aksi halde her Hendekli firmada ayni sahte pozitif.
  const g = adayGovdeler('Hendek Komple Dekorasyon & Ergin Yapı');
  assert.ok(!g.includes('hendek'), 'şehir adı tek başına aday olmamalı');
  assert.ok(!g.includes('dekorasyon'), 'sektör kelimesi tek başına aday olmamalı');
  assert.ok(g.includes('hendekdekorasyon'), 'ama çift içinde geçmeli');

  // Ayirt edici tek kelime hala deneniyor.
  assert.ok(adayGovdeler('ÖZDEN TİCARET').includes('ozden'));
});

test('alan adı: iki sektör kelimesi birleştirilmez', () => {
  // Bu filtre olmadan arac gercek ama ALAKASIZ adresler buluyordu:
  // <sektor><sektor>.com kaliplarinin neredeyse hepsi kayitli ve hicbiri
  // bu isletmelerin degil. Gurultu artinca uyari okunmaz olur.
  const s = adayGovdeler('Prizma Tadilat Dekorasyon');
  assert.ok(!s.includes('tadilatdekorasyon'), 'sektör+sektör çifti üretilmemeli');
  assert.ok(s.includes('prizmatadilat'), 'marka+sektör çifti üretilmeli');

  const k = adayGovdeler('Sapanca Bahçe Peyzaj');
  assert.ok(!k.includes('bahcepeyzaj'), 'sektör+sektör çifti üretilmemeli');
  assert.ok(k.includes('sapancabahce'), 'yer+sektör çifti üretilmeli');
});
