import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isletmeTaslakSemasi, type Dil, type IsletmeTaslak } from '@studio/data';

import {
  ESIKLER,
  anasayfaMetadata,
  hizmetMetadata,
  bolgeMetadata,
  sabitSayfaMetadata,
  baglamOlustur,
  anasayfaGrafi,
  isletmeLd,
  hizmetLd,
  sssLd,
  kirintiLd,
  ldMetni,
  schemaTipi,
  robotsUret,
  sitemapUret,
  yol,
  kanonik,
  dilAlternatifleri,
} from '../src/index.ts';

// ---------------------------------------------------------------- fikstürler

const kavakdere: IsletmeTaslak = isletmeTaslakSemasi.parse({
  slug: 'kavakdere-tas',
  ad: 'Kavakdere Taş Döşeme',
  kurulusYili: 1985,
  sektor: 'kilit taşı döşeme',
  ozet: 'Düzce ve çevresinde 41 yıldır parke taş döşeme, doğal taş işleme ve beton avlu uygulaması yapıyoruz.',
  marka: { renkler: { ana: '#1f2933' }, logo: { url: '/logo.svg', alt: 'Kavakdere Taş' } },
  iletisim: { telefon: '0380 555 55 55', whatsapp: '+903805555555', eposta: 'info@kavakderetas.example' },
  adresler: [
    {
      sokak: 'Fatih Mah. D-100 No:532',
      ilce: 'Düzce Merkez',
      il: 'Düzce',
      postaKodu: '81100',
      enlem: 40.8438,
      boylam: 31.1565,
      mapsUrl: 'https://maps.google.com/?q=kavakderetas',
    },
  ],
  hizmetVerilenBolgeler: [
    { ad: 'Düzce', tur: 'il', il: 'Düzce', sayfaAc: true },
    { ad: 'Akçakoca', tur: 'ilce', il: 'Düzce', sayfaAc: true },
    { ad: 'Gölyaka', tur: 'ilce', il: 'Düzce', sayfaAc: false },
  ],
  hizmetler: [
    {
      slug: 'kilit-tasi-doseme',
      ad: 'Kilit taşı döşeme',
      ozet: 'Avlu, bahçe ve otopark için parke taşı döşeme. Ücretsiz keşif, sabit fiyat.',
      anahtarKelimeler: ['düzce kilit taşı', 'parke taşı döşeme'],
      oneCikan: true,
      fiyat: { min: 350, max: 750, birim: 'm²', paraBirimi: 'TRY' },
    },
    {
      slug: 'istinat-duvari',
      ad: 'İstinat duvarı',
      ozet: 'Betonarme ve doğal taş istinat duvarı uygulaması.',
      anahtarKelimeler: ['düzce istinat duvarı'],
    },
  ],
  galeri: [
    { url: '/is-1.jpg', alt: 'Döşenmiş avlu', oneCikan: true },
    { url: '/is-2.jpg', alt: 'Doğal taş duvar' },
  ],
  referanslar: [
    { yazar: 'Mehmet K.', metin: 'Temiz iş, sözünde durdu.', puan: 5, kaynak: 'musteri' },
    { yazar: 'Ayşe T.', metin: 'Fiyat değişmedi, tarihinde bitti.', puan: 4, kaynak: 'musteri' },
  ],
  sss: [{ soru: 'Keşif ücretli mi?', cevap: 'Hayır, Düzce içi keşif ücretsiz.' }],
  calismaSaatleri: [
    { gun: 1, acilis: '08:00', kapanis: '18:00' },
    { gun: 0, kapali: true },
  ],
  sosyal: { instagram: 'https://instagram.com/kavakderetas' },
  seo: { alanAdi: 'kavakderetas.example', indekslenebilir: true, gbpUrl: 'https://maps.google.com/?q=kavakderetas-gbp' },
  gbpMetrikleri: { puan: 4.8, yorumSayisi: 34 },
});

const zefir: IsletmeTaslak = isletmeTaslakSemasi.parse({
  slug: 'zefir-fx',
  ad: 'ZEFİR FX',
  sektor: 'havai fişek gösterisi',
  ozet: {
    tr: 'Müzikle senkron pyromusical prodüksiyonlar ve büyük ölçekli havai fişek gösterileri.',
    en: 'Music-synchronised pyromusical productions and large-scale fireworks displays.',
    ar: 'عروض الألعاب النارية المتزامنة مع الموسيقى.',
  },
  marka: { renkler: { ana: '#0b0d10' } },
  iletisim: { telefon: '0212 555 55 55' },
  adresler: [{ ilce: 'Sarıyer', il: 'İstanbul' }],
  hizmetVerilenBolgeler: [
    { ad: 'Türkiye', tur: 'ulke', sayfaAc: false },
    { ad: 'BAE', tur: 'ulke', ulke: 'AE', sayfaAc: false },
  ],
  hizmetler: [
    {
      slug: 'pyromusical',
      ad: { tr: 'Pyromusical gösteri', en: 'Pyromusical show', ar: 'عرض بيروميوزيكال' },
      ozet: { tr: 'Müziğe senkron koreografi.', en: 'Choreography synchronised to music.' },
      oneCikan: true,
    },
  ],
  galeri: [{ url: '/gosteri.jpg', alt: { tr: 'Havai fişek gösterisi', en: 'Fireworks display' } }],
  diller: { varsayilan: 'tr', destekli: ['tr', 'en', 'ar'] },
  seo: { alanAdi: 'zefirfx.example', indekslenebilir: true },
});

const demoTaslak: IsletmeTaslak = isletmeTaslakSemasi.parse({
  slug: 'pusula-insaat',
  ad: 'Pusula İnşaat Müteahhitlik',
  sektor: 'müteahhit',
  adresler: [{ il: 'Düzce' }],
  // indekslenebilir varsayilan olarak false — demo asamasi
});

// ---------------------------------------------------------------- rotalar

test('rotalar: varsayılan dil ön ek almaz, diğerleri alır', () => {
  const baglam = baglamOlustur(zefir);

  assert.equal(yol({ tur: 'anasayfa' }, 'tr', baglam), '/');
  assert.equal(yol({ tur: 'anasayfa' }, 'en', baglam), '/en');
  assert.equal(yol({ tur: 'hizmet', slug: 'pyromusical' }, 'tr', baglam), '/hizmetler/pyromusical');
});

test('rotalar: URL segmentleri de yerelleşiyor', () => {
  const baglam = baglamOlustur(zefir);

  // /en/hizmetler/... değil /en/services/... — İngilizce arayan kullanıcı için
  // hem sıralama hem tıklama oranı farkı yaratıyor.
  assert.equal(yol({ tur: 'hizmet', slug: 'pyromusical' }, 'en', baglam), '/en/services/pyromusical');
  assert.equal(yol({ tur: 'sabit', segment: 'iletisim' }, 'en', baglam), '/en/contact');
  assert.equal(yol({ tur: 'sabit', segment: 'iletisim' }, 'ar', baglam), '/ar/ittisal');
});

test('hreflang: bütün diller + x-default üretiliyor', () => {
  const baglam = baglamOlustur(zefir);
  const alt = dilAlternatifleri({ tur: 'anasayfa' }, baglam);

  assert.equal(alt.tr, 'https://zefirfx.example/');
  assert.equal(alt.en, 'https://zefirfx.example/en');
  assert.equal(alt.ar, 'https://zefirfx.example/ar');
  assert.equal(alt['x-default'], 'https://zefirfx.example/', 'x-default varsayılan dile işaret etmeli');
  assert.equal(Object.keys(alt).length, 4);
});

// ---------------------------------------------------------------- metadata

test('metadata: üretilen başlıklar KENDİ denetim motorumuzun eşiklerini geçiyor', () => {
  // Bu testin anlamı: prospect'in sitesini "başlık zayıf" diye işaretleyen
  // ölçüt, bizim ürettiğimiz başlıkta da sağlanmak zorunda.
  const adaylar: { ad: string; baslik: string }[] = [];

  for (const dil of ['tr', 'en', 'ar'] as Dil[]) {
    adaylar.push({ ad: `zefir/anasayfa/${dil}`, baslik: anasayfaMetadata(zefir, dil).title });
    adaylar.push({
      ad: `zefir/hizmet/${dil}`,
      baslik: hizmetMetadata(zefir, zefir.hizmetler[0]!, dil).title,
    });
  }

  adaylar.push({ ad: 'kavakdere/anasayfa', baslik: anasayfaMetadata(kavakdere, 'tr').title });
  for (const hizmet of kavakdere.hizmetler) {
    adaylar.push({ ad: `kavakdere/${hizmet.slug}`, baslik: hizmetMetadata(kavakdere, hizmet, 'tr').title });
  }
  for (const bolge of kavakdere.hizmetVerilenBolgeler) {
    adaylar.push({ ad: `kavakdere/bolge/${bolge.ad}`, baslik: bolgeMetadata(kavakdere, bolge, 'tr').title });
  }
  for (const segment of ['hakkinda', 'iletisim', 'galeri', 'sss'] as const) {
    adaylar.push({
      ad: `kavakdere/${segment}`,
      baslik: sabitSayfaMetadata(kavakdere, segment, 'tr').title,
    });
  }

  for (const { ad, baslik } of adaylar) {
    assert.ok(
      baslik.length >= ESIKLER.baslikEnAz,
      `${ad}: başlık çok kısa (${baslik.length}) — "${baslik}"`,
    );
    assert.ok(
      baslik.length <= ESIKLER.baslikEnFazla,
      `${ad}: başlık çok uzun (${baslik.length}) — "${baslik}"`,
    );
  }
});

test('metadata: açıklamalar da eşik aralığında', () => {
  const hepsi = [
    anasayfaMetadata(kavakdere, 'tr'),
    hizmetMetadata(kavakdere, kavakdere.hizmetler[0]!, 'tr'),
    bolgeMetadata(kavakdere, kavakdere.hizmetVerilenBolgeler[1]!, 'tr'),
    sabitSayfaMetadata(kavakdere, 'iletisim', 'tr'),
    anasayfaMetadata(zefir, 'en'),
  ];

  for (const m of hepsi) {
    assert.ok(m.description.length >= ESIKLER.aciklamaEnAz, `çok kısa: "${m.description}"`);
    assert.ok(m.description.length <= ESIKLER.aciklamaEnFazla, `çok uzun: "${m.description}"`);
  }
});

test('metadata: başlık kalıbı doğru — hizmet sayfasında arama terimi başta', () => {
  const m = hizmetMetadata(kavakdere, kavakdere.hizmetler[0]!, 'tr');

  assert.match(m.title, /^Kilit taşı döşeme Düzce/, 'arama terimi + şehir başta olmalı');
  assert.match(m.title, /Kavakdere Taş/, 'marka adı sonda olmalı');
});

test('metadata: çok dilli işletmede içerik doğru dile çözülüyor', () => {
  const tr = anasayfaMetadata(zefir, 'tr');
  const en = anasayfaMetadata(zefir, 'en');

  assert.match(tr.description, /senkron|Müzik/);
  assert.match(en.description, /Music-synchronised/);
  assert.equal(en.openGraph.locale, 'en_US');
  assert.equal(en.alternates.canonical, 'https://zefirfx.example/en');
});

test('metadata: demo aşamasındaki site indekslenmiyor', () => {
  const m = anasayfaMetadata(demoTaslak, 'tr', 'pusula-demo.vercel.app');

  assert.equal(m.robots.index, false);
  assert.equal(m.robots.follow, false);
  assert.equal(m.alternates.canonical, 'https://pusula-demo.vercel.app/');
});

test('metadata: yayına alınmış site indeksleniyor', () => {
  assert.equal(anasayfaMetadata(kavakdere, 'tr').robots.index, true);
});

test('metadata: metadataBase alan adından türüyor', () => {
  // Verilmezse Next.js localhost varsayıyor ve paylaşım kartları kırık çıkıyor.
  assert.equal(anasayfaMetadata(kavakdere, 'tr').metadataBase.href, 'https://kavakderetas.example/');
  assert.equal(
    anasayfaMetadata(demoTaslak, 'tr', 'pusula-demo.vercel.app').metadataBase.href,
    'https://pusula-demo.vercel.app/',
  );
});

// ---------------------------------------------------------------- JSON-LD

test('schemaTipi: sektöre göre doğru schema.org tipi', () => {
  assert.equal(schemaTipi('müteahhit'), 'HomeAndConstructionBusiness');
  assert.equal(schemaTipi('kilit taşı döşeme'), 'HomeAndConstructionBusiness');
  assert.equal(schemaTipi('diş kliniği'), 'Dentist');
  assert.equal(schemaTipi('oto servis'), 'AutoRepair');
  assert.equal(schemaTipi('butik otel'), 'LodgingBusiness');
  assert.equal(schemaTipi(undefined), 'LocalBusiness');
});

test('schemaTipi: Türkçe büyük harfli kategoriler de tanınıyor', () => {
  // Regresyon: `.toLowerCase()` kullanan sürüm bunların hiçbirini tanımıyordu.
  // Google'ın kategori adları sık sık büyük harfli geliyor.
  assert.equal(schemaTipi('İNŞAAT FİRMASI'), 'HomeAndConstructionBusiness');
  assert.equal(schemaTipi('ÇATI USTASI'), 'HomeAndConstructionBusiness');
  assert.equal(schemaTipi('PEYZAJ MİMARLIĞI'), 'HomeAndConstructionBusiness');
  assert.equal(schemaTipi('DİŞ KLİNİĞİ'), 'Dentist');
});

test('schemaTipi: iç mimarlık ve tadilat inşaat sayılıyor', () => {
  // "İç mimarlık ve tadilat" yazan bir prospect bu yüzden LocalBusiness
  // çıkıyordu — 'tadilat' ve 'mimar' kalıp listesinde yoktu.
  assert.equal(schemaTipi('iç mimarlık ve tadilat'), 'HomeAndConstructionBusiness');
  assert.equal(schemaTipi('Dekorasyon'), 'HomeAndConstructionBusiness');
});

test('schemaTipi: yapı malzemesi satıcısı HardwareStore', () => {
  // "yapı" kelimesi yüzünden inşaat firması sayılmamalı — mağaza bunlar.
  assert.equal(schemaTipi('Yapı Malzemeleri Mağazası'), 'HardwareStore');
  assert.equal(schemaTipi('NALBUR'), 'HardwareStore');
});

test('schemaTipi: fiziksel dükkânı olmayan meslekler ProfessionalService', () => {
  // Müşteri ofise gelmiyor, iş uzaktan yürüyor — LocalBusiness yanlış sinyal.
  assert.equal(schemaTipi('web tasarım ve SEO'), 'ProfessionalService');
  assert.equal(schemaTipi('yazılım geliştirme'), 'ProfessionalService');
  assert.equal(schemaTipi('mali müşavir'), 'ProfessionalService');
});

test('schemaTipi: ihracatçı/imalatçı LocalBusiness DEĞİL, Organization', () => {
  // Müşteri fabrikaya gelmiyor, satış yerel değil. LocalBusiness işaretlemek
  // hem yanlış hem yerel paket sinyallerini boşa harcıyor.
  assert.equal(schemaTipi('plastik enjeksiyon imalat'), 'Organization');
  assert.equal(schemaTipi('makine üretim ihracat'), 'Organization');
});

test('JSON-LD: işletme işaretlemesi beklenen alanları taşıyor', () => {
  const baglam = baglamOlustur(kavakdere);
  const ld = isletmeLd(kavakdere, 'tr', baglam);

  assert.equal(ld['@type'], 'HomeAndConstructionBusiness');
  assert.equal(ld.name, 'Kavakdere Taş Döşeme');
  assert.equal(ld.telephone, '0380 555 55 55');
  assert.equal(ld.foundingDate, '1985');

  const adres = ld.address as Record<string, unknown>;
  assert.equal(adres.addressLocality, 'Düzce Merkez');
  assert.equal(adres.postalCode, '81100');

  const geo = ld.geo as Record<string, unknown>;
  assert.equal(geo.latitude, 40.8438);

  const bolgeler = ld.areaServed as { name: string }[];
  assert.equal(bolgeler.length, 3);

  const saatler = ld.openingHoursSpecification as unknown[];
  assert.equal(saatler.length, 1, 'kapalı günler işaretlemeye girmemeli');

  const sosyal = ld.sameAs as string[];
  assert.ok(sosyal.includes('https://instagram.com/kavakderetas'));
  assert.ok(sosyal.includes('https://maps.google.com/?q=kavakderetas-gbp'));
});

test('JSON-LD: aggregateRating SADECE site üzerindeki yorumlardan üretilir', () => {
  const baglam = baglamOlustur(kavakdere);
  const ld = isletmeLd(kavakdere, 'tr', baglam);

  const puan = ld.aggregateRating as Record<string, unknown>;
  assert.equal(puan.reviewCount, 2, 'site üzerindeki 2 yorum');
  assert.equal(puan.ratingValue, 4.5, '(5 + 4) / 2');

  // GBP puanı 4.8 / 34 yorum. İşaretlemeye GİRMEMELİ — Google kendi sitenizde
  // yayınladığınız kendi hakkınızdaki puanları LocalBusiness işaretlemesinde
  // kullanmayı yasaklıyor, ihlali manuel işlem riski taşıyor.
  assert.notEqual(puan.ratingValue, 4.8);
  assert.notEqual(puan.reviewCount, 34);
});

test('JSON-LD: yorum yoksa aggregateRating hiç basılmıyor', () => {
  const ld = isletmeLd(zefir, 'tr', baglamOlustur(zefir));
  assert.equal(ld.aggregateRating, undefined);
});

test('JSON-LD: Google\'dan çekilen yorumlar aggregateRating\'e girmiyor', () => {
  // Demo üreteci Google yorumlarını referanslar alanına yazıyor. Sayfada
  // gösterilmeleri serbest; işaretlemeye girmeleri Google politikası ihlali.
  const googleYorumlu = isletmeTaslakSemasi.parse({
    ...kavakdere,
    referanslar: [
      { yazar: 'Ali V.', metin: 'Bahçe mobilyası aldık.', puan: 5, kaynak: 'google' },
      { yazar: 'Veli K.', metin: 'İlgili ekip.', puan: 4, kaynak: 'google' },
    ],
  });

  const ld = isletmeLd(googleYorumlu, 'tr', baglamOlustur(googleYorumlu));
  assert.equal(ld.aggregateRating, undefined, 'Google yorumları işaretlemeye girmemeli');

  // Site üzerinde toplanmış yorumlar girmeli.
  const karisik = isletmeTaslakSemasi.parse({
    ...kavakdere,
    referanslar: [
      { yazar: 'Ali V.', metin: 'Google yorumu.', puan: 5, kaynak: 'google' },
      { yazar: 'Mehmet K.', metin: 'Site üzerinden gelen yorum.', puan: 4, kaynak: 'musteri' },
    ],
  });

  const ld2 = isletmeLd(karisik, 'tr', baglamOlustur(karisik));
  const puan = ld2.aggregateRating as Record<string, unknown>;
  assert.equal(puan.reviewCount, 1, 'sadece site üzerinde toplanan sayılmalı');
  assert.equal(puan.ratingValue, 4);
});

test('JSON-LD: hizmet işaretlemesi işletmeye @id ile bağlanıyor', () => {
  const baglam = baglamOlustur(kavakdere);
  const ld = hizmetLd(kavakdere, kavakdere.hizmetler[0]!, 'tr', baglam);

  assert.equal(ld['@type'], 'Service');
  assert.equal(ld.name, 'Kilit taşı döşeme');
  assert.deepEqual(ld.provider, { '@id': 'https://kavakderetas.example/#isletme' });

  const teklif = ld.offers as Record<string, unknown>;
  assert.equal(teklif.priceCurrency, 'TRY');
});

test('JSON-LD: anasayfa grafiği tek @graph altında toplanıyor', () => {
  const graf = anasayfaGrafi(kavakdere, 'tr', baglamOlustur(kavakdere));

  assert.equal(graf['@context'], 'https://schema.org');
  const parcalar = graf['@graph'] as Record<string, unknown>[];

  assert.equal(parcalar.length, 3, 'isletme + site + sss');
  // Alt parçalarda tekrar @context olmamalı.
  for (const p of parcalar) assert.equal(p['@context'], undefined);

  const tipler = parcalar.map((p) => p['@type']);
  assert.deepEqual(tipler, ['HomeAndConstructionBusiness', 'WebSite', 'FAQPage']);
});

test('JSON-LD: SSS boşsa işaretleme üretilmiyor', () => {
  assert.equal(sssLd([], 'tr', 'tr'), undefined);
});

test('JSON-LD: kırıntı en az iki adım gerektiriyor', () => {
  const baglam = baglamOlustur(kavakdere);

  assert.equal(kirintiLd([{ ad: 'Anasayfa', sayfa: { tur: 'anasayfa' } }], 'tr', baglam), undefined);

  const ld = kirintiLd(
    [
      { ad: 'Anasayfa', sayfa: { tur: 'anasayfa' } },
      { ad: 'Kilit taşı döşeme', sayfa: { tur: 'hizmet', slug: 'kilit-tasi-doseme' } },
    ],
    'tr',
    baglam,
  );
  const adimlar = ld!.itemListElement as Record<string, unknown>[];
  assert.equal(adimlar[1]!.position, 2);
  assert.equal(adimlar[1]!.item, 'https://kavakderetas.example/hizmetler/kilit-tasi-doseme');
});

test('ldMetni: script kapanışı kaçırılıyor', () => {
  const zararli = ldMetni({ name: '</script><img onerror=alert(1)>' });
  assert.ok(!zararli.includes('</script>'));
  assert.ok(zararli.includes('\\u003c'));
});

// ---------------------------------------------------------------- sitemap / robots

test('sitemap: bütün diller × bütün sayfalar', () => {
  const baglam = baglamOlustur(kavakdere);
  const kayitlar = sitemapUret(kavakdere, baglam, { sonGuncelleme: '2026-07-30' });

  const urller = kayitlar.map((k) => k.url);
  assert.ok(urller.includes('https://kavakderetas.example/'));
  assert.ok(urller.includes('https://kavakderetas.example/hizmetler/kilit-tasi-doseme'));
  assert.ok(urller.includes('https://kavakderetas.example/bolgeler/akcakoca'));

  // sayfaAc: false olan bölge girmemeli.
  assert.ok(!urller.some((u) => u.includes('golyaka')), 'sayfaAc=false bölge sitemap\'e girmemeli');

  const anasayfa = kayitlar.find((k) => k.url === 'https://kavakderetas.example/');
  assert.equal(anasayfa?.priority, 1.0);
  assert.equal(anasayfa?.lastModified, '2026-07-30');
  assert.ok(anasayfa?.alternates?.languages['x-default']);
});

test('sitemap: çok dilli sitede her sayfa her dilde listeleniyor', () => {
  const kayitlar = sitemapUret(zefir, baglamOlustur(zefir));
  const urller = kayitlar.map((k) => k.url);

  assert.ok(urller.includes('https://zefirfx.example/'));
  assert.ok(urller.includes('https://zefirfx.example/en'));
  assert.ok(urller.includes('https://zefirfx.example/ar'));
  assert.ok(urller.includes('https://zefirfx.example/en/services/pyromusical'));
});

test('sitemap: demo sitesi sitemap yayınlamıyor', () => {
  assert.deepEqual(sitemapUret(demoTaslak, baglamOlustur(demoTaslak, 'demo.vercel.app')), []);
});

test('robots: demo her şeyi kapatıyor, yayın açıyor', () => {
  const demo = robotsUret(demoTaslak, baglamOlustur(demoTaslak, 'demo.vercel.app'));
  assert.deepEqual(demo.rules[0]!.disallow, ['/']);
  assert.equal(demo.sitemap, undefined);

  const canli = robotsUret(kavakdere, baglamOlustur(kavakdere));
  assert.deepEqual(canli.rules[0]!.allow, ['/']);
  assert.equal(canli.sitemap, 'https://kavakderetas.example/sitemap.xml');
});

test('kanonik: alan adı yoksa demo yer tutucusuna düşüyor', () => {
  const baglam = baglamOlustur(demoTaslak);
  assert.equal(kanonik({ tur: 'anasayfa' }, 'tr', baglam), 'https://demo.local/');
});

/*
   ABONELIK FIYATI.

   Bu testlerin sebebi somut: canli sitede aylik model isaretlemede HIC
   YOKTU. Sayfada "950 TL/ay + 4.000 kurulum" yaziyordu, yapisal veride
   sadece 18.000 vardi — yani makinelerin gordugu tek rakam pahali
   olandi. Sessizce yanlis olan bir seydi, hicbir sey kirilmiyordu.
*/

const aylikli: IsletmeTaslak = isletmeTaslakSemasi.parse({
  ...JSON.parse(JSON.stringify(kavakdere)),
  hizmetler: [
    {
      slug: 'bakim',
      ad: 'Bakım',
      ozet: 'Aylık bakım ve tek seferlik kurulum.',
      fiyat: {
        min: 18000,
        paraBirimi: 'TRY',
        birim: 'proje',
        abonelik: { tutar: 950, periyot: 'ay', kurulum: 4000 },
      },
    },
  ],
});

test('teklif: aylık ve tek seferlik AYRI teklifler olarak çıkıyor', () => {
  const ld = isletmeLd(aylikli, 'tr', baglamOlustur(aylikli));
  const teklifler = ld['makesOffer'] as Record<string, any>[];

  // Tek teklifte iki fiyat "ikisi birden geçerli" demek olurdu.
  // Müşteri birini seçiyor, o yüzden iki teklif.
  assert.equal(teklifler.length, 2);

  const aylik = teklifler[0]!['priceSpecification'];
  const tek = teklifler[1]!['priceSpecification'];
  assert.equal(aylik['@type'], 'CompoundPriceSpecification');
  assert.equal(tek['@type'], 'PriceSpecification');
  assert.equal(tek['minPrice'], 18000);
});

test('teklif: aylık tutar tekrar eden olarak işaretleniyor, düz price değil', () => {
  const ld = isletmeLd(aylikli, 'tr', baglamOlustur(aylikli));
  const bilesenler = (ld['makesOffer'] as Record<string, any>[])[0]!
    ['priceSpecification']['priceComponent'] as Record<string, any>[];

  const kurulum = bilesenler.find((b) => b['price'] === 4000)!;
  const aylik = bilesenler.find((b) => b['price'] === 950)!;

  // Ayirt eden sey referenceQuantity: olan tekrar ediyor, olmayan bir kerelik.
  assert.equal(kurulum['referenceQuantity'], undefined);
  assert.equal(aylik['referenceQuantity']['unitCode'], 'MON');
  assert.equal(aylik['referenceQuantity']['value'], 1);
});

test('teklif: abonelik yoksa fazladan teklif üretilmiyor', () => {
  const ld = isletmeLd(kavakdere, 'tr', baglamOlustur(kavakdere));
  const teklifler = ld['makesOffer'] as Record<string, any>[];
  assert.equal(teklifler.length, kavakdere.hizmetler.length);
});

/*
   SABIT SAYFA ACIKLAMALARI.

   Canli sitede /sss, /hakkinda ve /iletisim'in aciklamasi ilk iki kelime
   disinda BIREBIR ayniydi: hepsi "<Sayfa adi> — <Isletme>." + isletmenin
   genel ozeti. Anasayfanin aciklamasi da ayni cumleydi. Hicbir sey
   kirilmiyordu, sadece dort sayfa Google'a ayni seyi soyluyordu.
*/

test('sabit sayfa: açıklamalar birbirinden ayrışıyor', () => {
  const sayfalar = ['hakkinda', 'iletisim', 'sss'] as const;
  const aciklamalar = sayfalar.map((s) => sabitSayfaMetadata(kavakdere, s, 'tr').description);

  assert.equal(new Set(aciklamalar).size, sayfalar.length);

  // Anasayfayla da ayni olmamali — eski hatada oydu.
  const ana = anasayfaMetadata(kavakdere, 'tr').description;
  for (const a of aciklamalar) assert.notEqual(a, ana);
});

test('sabit sayfa: açıklama sayfanın kendi içeriğinden geliyor', () => {
  const sss = sabitSayfaMetadata(kavakdere, 'sss', 'tr').description;
  const ilkSoru = kavakdere.sss[0]!.soru as string;
  assert.ok(sss.includes(ilkSoru.slice(0, 20)), `SSS açıklamasında ilk soru yok: ${sss}`);

  const iletisim = sabitSayfaMetadata(kavakdere, 'iletisim', 'tr').description;
  const il = kavakdere.adresler[0]!.il!;
  assert.ok(iletisim.includes(il), `İletişim açıklamasında il yok: ${iletisim}`);
});

test('sabit sayfa: elle yazılan açıklama üretilene üstün geliyor', () => {
  const elleYazili = isletmeTaslakSemasi.parse({
    ...JSON.parse(JSON.stringify(kavakdere)),
    seo: { ...kavakdere.seo, sayfaAciklamalari: { iletisim: 'Cumartesi de açığız.' } },
  });
  const d = sabitSayfaMetadata(elleYazili, 'iletisim', 'tr').description;
  assert.ok(d.includes('Cumartesi de açığız.'), d);
});

test('sabit sayfa: malzeme yoksa işletme özetine düşüyor, boş kalmıyor', () => {
  const sssiz = isletmeTaslakSemasi.parse({
    ...JSON.parse(JSON.stringify(kavakdere)),
    sss: [],
  });
  const d = sabitSayfaMetadata(sssiz, 'sss', 'tr').description;
  assert.ok(d.length >= ESIKLER.aciklamaEnAz, `çok kısa: ${d}`);
});

test('iletişim: adres yoksa açıklama "adres" vaat etmiyor', () => {
  const adressiz = isletmeTaslakSemasi.parse({
    ...JSON.parse(JSON.stringify(kavakdere)),
    adresler: [],
    hizmetVerilenBolgeler: [{ ad: 'Düzce', tur: 'il', il: 'Düzce' }],
  });
  const d = sabitSayfaMetadata(adressiz, 'iletisim', 'tr').description;
  assert.ok(d.includes('Düzce'), d);
  assert.ok(!d.includes('adres'), `adresi olmayan sayfa adres vaat ediyor: ${d}`);

  // Adresi olanda kelime geri geliyor.
  const d2 = sabitSayfaMetadata(kavakdere, 'iletisim', 'tr').description;
  assert.ok(d2.includes('adres'), d2);
});

test('bölge sırası: ilk bölge başlıklara giriyor', () => {
  const cokBolgeli = isletmeTaslakSemasi.parse({
    ...JSON.parse(JSON.stringify(kavakdere)),
    adresler: [],
    hizmetVerilenBolgeler: [
      { ad: 'Düzce', tur: 'il', il: 'Düzce' },
      { ad: 'Türkiye', tur: 'ulke' },
    ],
  });
  // anaSehir listenin ilkini alıyor; sıra değişirse başlıklar da değişir.
  assert.ok(anasayfaMetadata(cokBolgeli, 'tr').title.includes('Düzce'));
});
