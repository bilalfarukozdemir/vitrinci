import { test } from 'node:test';
import assert from 'node:assert/strict';

import { sablonSec } from '../src/sablonlar.ts';

test('perakende işletmeye şablon UYGULANMIYOR', () => {
  // Gerçek vaka: "bahçe düzenleme" aramasında çıktı ama
  // bahçe MOBİLYASI mağazasıydı. Önceki sürüm ona peyzaj hizmetleri yazdı.
  const magaza = sablonSec(['furniture_store', 'point_of_interest'], 'Bahçe mobilyası mağazası');
  assert.equal(magaza.sablon, null);
  assert.match(magaza.gerekce, /perakende/);

  // Tür etiketi olmasa bile kategori metninden yakalanmalı.
  const metinden = sablonSec([], 'Bahçe mobilyası mağazası');
  assert.equal(metinden.sablon, null);
});

test('perakende kontrolü metin eşlemesinden ÖNCE çalışıyor', () => {
  // "Bahçe mobilyası mağazası" metni peyzaj şablonunun /bahce/ kalıbına da
  // uyuyor. Sıra yanlış olsaydı yine peyzaj şablonu yerdi.
  const sonuc = sablonSec([], 'Bahçe mobilyası mağazası');
  assert.equal(sonuc.sablon, null, 'mağaza kontrolü önce gelmeli');
});

test('yapı malzemesi satıcısı kendi şablonunu alıyor', () => {
  // Gerçek taramada en büyük karşılıksız segment: 1.322 kaydın 121'i.
  // Genel mağaza kontrolünden ÖNCE eşleşmesi gerekiyor.
  const turden = sablonSec(['building_materials_store'], 'Yapı Malzemeleri Mağazası');
  assert.equal(turden.sablon?.ad, 'Yapı malzemesi satışı');

  // Tür etiketi olmasa bile kategori metninden.
  const metinden = sablonSec([], 'Yapı Malzemeleri Mağazası');
  assert.equal(metinden.sablon?.ad, 'Yapı malzemesi satışı');

  assert.equal(sablonSec([], 'Nalbur').sablon?.ad, 'Yapı malzemesi satışı');
  assert.equal(sablonSec(['hardware_store'], 'Hırdavatçı').sablon?.ad, 'Yapı malzemesi satışı');
});

test('yapı malzemesi olmayan perakende hâlâ şablonsuz', () => {
  // Sıralama doğru olmasaydı yapı market kontrolü mobilyacıyı da yakalardı.
  assert.equal(sablonSec(['furniture_store'], 'Bahçe mobilyası mağazası').sablon, null);
  assert.equal(sablonSec(['clothing_store'], 'Giyim mağazası').sablon, null);
});

test('Google tür etiketi şablonu doğru seçiyor', () => {
  const peyzaj = sablonSec(['landscaper'], 'her neyse');
  assert.equal(peyzaj.sablon?.ad, 'Peyzaj ve bahçe');
  assert.match(peyzaj.gerekce, /tür: landscaper/);

  const insaat = sablonSec(['roofing_contractor'], undefined);
  assert.equal(insaat.sablon?.ad, 'İnşaat ve tadilat');
});

test('tür yoksa kategori metnine düşüyor', () => {
  const sonuc = sablonSec([], 'Peyzaj müteahhidi');
  assert.equal(sonuc.sablon?.ad, 'Peyzaj ve bahçe');
  assert.match(sonuc.gerekce, /kategori/);
});

test('Türkçe büyük harf kategoriyi de tanıyor', () => {
  // trNormalize olmadan "ÇATI USTASI" hiçbir kalıba uymaz.
  assert.equal(sablonSec([], 'ÇATI USTASI').sablon?.ad, 'İnşaat ve tadilat');
  assert.equal(sablonSec([], 'İNŞAAT FİRMASI').sablon?.ad, 'İnşaat ve tadilat');
});

test('tanınmayan kategoride şablon seçilmiyor — tahmin YOK', () => {
  const sonuc = sablonSec(['veterinary_care'], 'Veteriner kliniği');
  assert.equal(sonuc.sablon, null);
  assert.match(sonuc.gerekce, /tanınmayan/);

  const bos = sablonSec([], undefined);
  assert.equal(bos.sablon, null);
  assert.match(bos.gerekce, /kategori bilgisi yok/);
});
