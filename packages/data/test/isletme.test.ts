import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  coz,
  cozZorunlu,
  tanimliDiller,
  slugla,
  trNormalize,
  isletmeTaslakSemasi,
  yayinaHazirMi,
  tamOlarakDogrula,
} from '../src/index.ts';
import { prospecttenTaslak } from '../src/adapters/prospect.ts';

// ---------------------------------------------------------------- yerelleştirme

test('yerelli: tek dilli düz metin olduğu gibi çözülür', () => {
  assert.equal(coz('41 yıldır avlu döşüyoruz', 'tr'), '41 yıldır avlu döşüyoruz');
  // Tek dilli veri, hiç dokunmadan İngilizce istendiğinde de aynı metni verir —
  // tek dilliden çok dilliye geçiş bu yüzden migration gerektirmiyor.
  assert.equal(coz('41 yıldır avlu döşüyoruz', 'en'), '41 yıldır avlu döşüyoruz');
});

test('yerelli: çok dilli nesne doğru dile çözülür, eksikte varsayılana düşer', () => {
  const ozet = { tr: 'Havai fişek gösterileri', en: 'Fireworks displays' };

  assert.equal(coz(ozet, 'en'), 'Fireworks displays');
  assert.equal(coz(ozet, 'tr'), 'Havai fişek gösterileri');
  assert.equal(coz(ozet, 'ar'), 'Havai fişek gösterileri', 'tanımsız dil varsayılana düşmeli');
  assert.deepEqual(tanimliDiller(ozet), ['tr', 'en']);
});

test('yerelli: varsayılan da yoksa mevcut ilk dile düşer', () => {
  assert.equal(coz({ de: 'Feuerwerk' }, 'ru', 'tr'), 'Feuerwerk');
});

test('cozZorunlu: veri hiç yoksa sessizce undefined dönmez, hata atar', () => {
  // Zorunlu bir alanın çalışma anında boş gelmesi, sayfada boş bir başlık
  // basmaktan daha iyi — build aşamasında yakalanmasını istiyoruz.
  assert.throws(() => cozZorunlu(undefined as unknown as string, 'tr'), /çözülemedi/);
});

test('yerelli: geçersiz dil kodu reddedilir', () => {
  const sonuc = isletmeTaslakSemasi.safeParse({
    slug: 'test',
    ad: 'Test',
    ozet: { tr: 'iyi', klingon: 'kötü' },
  });
  assert.equal(sonuc.success, false);
});

// ---------------------------------------------------------------- slug

test('trNormalize: Türkçe büyük harf tuzağını kapatır', () => {
  // JavaScript'in `i` bayrağı Türkçe büyük harflerde çalışmıyor:
  // /inşaat/i.test("İNŞAAT") === false. Desen eşleştiren her yer bunu kullanmalı.
  assert.equal(/inşaat/i.test('İNŞAAT'), false, 'sorunun kendisi — bu yüzden var');

  assert.equal(trNormalize('İNŞAAT'), 'insaat');
  assert.equal(trNormalize('inşaat'), 'insaat');
  assert.equal(trNormalize('YAPI'), 'yapi');
  assert.equal(trNormalize('yapı'), 'yapi');
  assert.equal(trNormalize('BAHÇE DÜZENLEME'), 'bahce duzenleme');
  assert.equal(trNormalize('bahçe düzenleme'), 'bahce duzenleme');
  assert.equal(trNormalize('  IŞIKLAR   ÇATI  '), 'isiklar cati');

  // Aksanlı ve aksansız yazım aynı sonuca inmeli.
  assert.equal(trNormalize('Işıklar'), trNormalize('Isiklar'));
  assert.equal(trNormalize(undefined), '');
});

test('slugla: Türkçe karakterler doğru çevrilir', () => {
  assert.equal(slugla('Kavakdere Taş Peyzaj'), 'kavakdere-tas-peyzaj');
  assert.equal(slugla('ZEFİR FX Işık & Gösteri'), 'zefir-fx-isik-ve-gosteri');
  assert.equal(slugla('Şişli Diş Kliniği'), 'sisli-dis-klinigi');
  assert.equal(slugla('  Çift  Boşluk  '), 'cift-bosluk');
});

// ---------------------------------------------------------------- taslak vs tam

test('taslak: sadece slug ve ad ile geçerli — demo aşaması için yeterli', () => {
  const taslak = isletmeTaslakSemasi.parse({ slug: 'ornek-insaat', ad: 'Örnek İnşaat' });

  assert.equal(taslak.slug, 'ornek-insaat');
  assert.deepEqual(taslak.hizmetler, []);
  assert.deepEqual(taslak.diller, { varsayilan: 'tr', destekli: ['tr'] });
  assert.equal(taslak.seo.indekslenebilir, false, 'demo varsayılan olarak indekslenmemeli');
});

test('taslak: bozuk slug reddedilir', () => {
  assert.equal(isletmeTaslakSemasi.safeParse({ slug: 'Büyük Harf', ad: 'x' }).success, false);
  assert.equal(isletmeTaslakSemasi.safeParse({ slug: 'bos--tire-', ad: 'x' }).success, false);
});

test('tam şema: eksik taslağı okunabilir hatalarla reddeder', () => {
  const sonuc = tamOlarakDogrula({ slug: 'ornek', ad: 'Örnek' });

  assert.equal(sonuc.basarili, false);
  if (sonuc.basarili) return;

  const birlesik = sonuc.hatalar.join('\n');
  assert.match(birlesik, /ozet/);
  assert.match(birlesik, /hizmetler|görsel|marka/);
});

test('tam şema: telefon veya WhatsApp yoksa yayına alınamaz', () => {
  const temel = {
    slug: 'tam-ornek',
    ad: 'Tam Örnek İnşaat',
    ozet: 'Düzce ve çevresinde 20 yıldır kilit taşı döşüyoruz.',
    sektor: 'insaat',
    marka: { renkler: { ana: '#0f172a' } },
    hizmetler: [{ slug: 'kilit-tasi', ad: 'Kilit taşı döşeme', ozet: 'Avlu ve bahçe döşeme' }],
    galeri: [{ url: '/is-1.jpg', alt: 'Döşenmiş avlu' }],
    adresler: [{ il: 'Düzce' }],
    seo: { alanAdi: 'ornekinsaat.example' },
  };

  const telefonsuz = tamOlarakDogrula(temel);
  assert.equal(telefonsuz.basarili, false);
  if (!telefonsuz.basarili) {
    assert.match(telefonsuz.hatalar.join('\n'), /Telefon veya WhatsApp/);
  }

  const telefonlu = tamOlarakDogrula({ ...temel, iletisim: { telefon: '0380 555 55 55' } });
  assert.equal(telefonlu.basarili, true, JSON.stringify(telefonlu, null, 2));
});

// ---------------------------------------------------------------- adaptör

test('adaptör: Maps kaydı kanonik taslağa çevrilir', () => {
  const taslak = prospecttenTaslak(
    {
      id: 'ChIJexampleplaceid123',
      ad: 'Kavakdere Taş Döşeme',
      adres: 'Fatih Mah. D-100 Karayolu No:532, 81100 Düzce Merkez/Düzce, Türkiye',
      site: 'https://kavakderetas.example',
      telefon: '0380 555 55 55',
      puan: 4.8,
      yorumSayisi: 34,
      mapsUrl: 'https://maps.google.com/?q=kavakderetas',
      sorgu: 'kilit taşı döşeme',
      sehir: 'Düzce',
    },
    { taranmaTarihi: '2026-07-30' },
  );

  assert.equal(taslak.slug, 'kavakdere-tas-doseme');
  assert.equal(taslak.sektor, 'kilit taşı döşeme');

  const adres = taslak.adresler[0];
  assert.ok(adres);
  assert.equal(adres.il, 'Düzce');
  assert.equal(adres.ilce, 'Düzce Merkez');
  assert.equal(adres.postaKodu, '81100');
  assert.match(adres.sokak ?? '', /D-100/);

  assert.equal(taslak.iletisim.telefon, '0380 555 55 55');
  // 0380 Bolu SABİT HATTI — WhatsApp'ı yok, alan boş kalmalı.
  //
  // Bu satır eskiden '+903805555555' bekliyordu, yani hatalı davranışı
  // doğruluyordu. Gerçek sonucu bir prospect'te gördük: sabit hattan
  // üretilen WhatsApp bağı hem "müşteriye WhatsApp'tan yaz" dedirtiyordu
  // hem de demo sayfasında kırık bir buton çıkarıyordu.
  assert.equal(taslak.iletisim.whatsapp, undefined, 'Sabit hattan WhatsApp bağı üretilmemeli');

  // Cep numarasi VERILDIGINDE cevrilmeye devam etmeli — geriye donuk koruma.
  const cepli = prospecttenTaslak(
    { id: 'ChIJcepnumarasi0001', ad: 'Cep Numaralı Firma', adres: 'Düzce', telefon: '0555 555 55 55', sorgu: 'test', sehir: 'Düzce' },
    { taranmaTarihi: '2026-07-30' },
  );
  assert.equal(cepli.iletisim.whatsapp, '+905555555555', 'Cep numarası WhatsApp formatına çevrilmeli');

  assert.equal(taslak.gbpMetrikleri?.puan, 4.8);
  assert.equal(taslak.gbpMetrikleri?.yorumSayisi, 34);

  // Provenance: Maps verisi müşteri onaylamadan yayına çıkmaz.
  assert.equal(taslak.kaynak.tur, 'maps');
  assert.equal(taslak.kaynak.mapsPlaceId, 'ChIJexampleplaceid123');
  assert.equal(taslak.kaynak.musteriOnayli, false);
  assert.equal(taslak.seo.indekslenebilir, false);
});

test('adaptör: adres yoksa da çökmez', () => {
  const taslak = prospecttenTaslak({ id: 'abc12345', ad: 'Sitesiz Firma', sehir: 'Bolu' });

  assert.equal(taslak.slug, 'sitesiz-firma');
  assert.equal(taslak.adresler[0]?.il, 'Bolu', 'şehir ipucu adres yokken devreye girmeli');
  assert.equal(taslak.iletisim.whatsapp, undefined);
});

test('adaptör: isimden slug çıkmazsa yedek slug şemayı geçer', () => {
  // Maps place id'leri büyük harf içeriyor, şema sadece küçük harf kabul ediyor.
  const taslak = prospecttenTaslak({ id: 'ChIJ98765432', ad: '!!!' });
  assert.equal(taslak.slug, 'isletme-chij9876');
});

// ---------------------------------------------------------------- eksik listesi

test('yayinaHazirMi: müşteriye gönderilebilir eksik listesi üretir', () => {
  const taslak = prospecttenTaslak({
    id: 'ChIJabc',
    ad: 'Örnek Peyzaj',
    adres: '81100 Düzce Merkez/Düzce, Türkiye',
    telefon: '0380 555 55 55',
    sorgu: 'peyzaj',
    sehir: 'Düzce',
  });

  const { hazir, eksikler } = yayinaHazirMi(taslak);

  assert.equal(hazir, false);
  const alanlar = eksikler.map((e) => e.alan);

  assert.ok(alanlar.includes('ozet'));
  assert.ok(alanlar.includes('marka.logo'));
  assert.ok(alanlar.includes('galeri'));
  assert.ok(alanlar.includes('hizmetler'));
  assert.ok(alanlar.includes('kaynak.musteriOnayli'));

  // Maps'ten geldiği için bunlar eksik OLMAMALI.
  assert.ok(!alanlar.includes('iletisim'), 'telefon Maps\'ten geldi');
  assert.ok(!alanlar.includes('adresler'), 'adres Maps\'ten geldi');

  // Her eksik insan diliyle açıklanmış olmalı — bu çıktı müşteriye gidiyor.
  for (const eksik of eksikler) {
    assert.ok(eksik.aciklama.length > 10, `"${eksik.alan}" için açıklama yetersiz`);
  }
});
