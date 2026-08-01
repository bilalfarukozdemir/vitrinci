import { trNormalize, type Dil, type Hizmet, type IsletmeTaslak, type Sss } from '@studio/data';

import { anaHizmet, metin } from './metin.ts';
import { kanonik, type RotaBaglami, type SayfaTuru } from './rotalar.ts';

export type Ld = Record<string, unknown>;

/**
 * Sektor metninden schema.org tipi.
 *
 * Onemli ayrim: imalatci/ihracatci bir firma LocalBusiness DEGILDIR —
 * musteri fabrikaya gelmiyor, satis yerel degil. Organization kullanmak
 * hem dogru hem de yerel paket sinyallerini bosa harcamiyor.
 */
export function schemaTipi(sektor: string | undefined): string {
  // trNormalize SART. Onceki surum `.toLowerCase()` kullaniyordu ve Turkce
  // buyuk harfli kategorilerde SESSIZCE calismiyordu: "İNŞAAT FİRMASI"
  // kuculunce "i" + birlesen nokta uretiyor ve 'insaat' kalibina uymuyor.
  // Ayni hata sinifi projede ucuncu kez cikti — kaliplar artik hep ASCII.
  const s = trNormalize(sektor);
  const gecer = (...anahtarlar: string[]) => anahtarlar.some((a) => s.includes(a));

  if (gecer('imalat', 'uretim', 'ihracat', 'fabrika', 'sanayi', 'enjeksiyon', 'kalip doku')) {
    return 'Organization';
  }

  // Yapi malzemesi perakendesi — insaat kontrolunden ONCE, yoksa "yapi"
  // kelimesi yuzunden HomeAndConstructionBusiness olurlardi.
  if (gecer('yapi malzeme', 'insaat malzeme', 'nalbur', 'hirdavat', 'yapi market')) {
    return 'HardwareStore';
  }

  if (gecer('dis klinigi', 'dis hekim', 'agiz ve dis')) return 'Dentist';
  if (gecer('veteriner')) return 'VeterinaryCare';
  if (gecer('klinik', 'tip merkez', 'goz merkez', 'fizik tedavi', 'saglik merkez')) return 'MedicalClinic';
  if (gecer('estetik', 'guzellik', 'sac ekim', 'kuafor')) return 'HealthAndBeautyBusiness';

  if (
    gecer(
      'muteahhit', 'insaat', 'peyzaj', 'bahce duzenleme', 'kilit tasi', 'dogal tas',
      'beton', 'cati', 'istinat', 'prefabrik', 'hafriyat', 'tadilat', 'dekorasyon',
      'mimar', 'yalitim', 'mantolama', 'tesisat', 'yapi',
    )
  ) {
    return 'HomeAndConstructionBusiness';
  }

  if (gecer('oto servis', 'oto kurtarma', 'kaporta', 'ekspertiz', 'arac kiralama', 'lastik')) {
    return 'AutoRepair';
  }
  if (gecer('otel', 'bungalov', 'apart', 'konaklama', 'tatil koyu')) return 'LodgingBusiness';
  if (gecer('restoran', 'lokanta', 'kafe', 'kebap')) return 'Restaurant';
  if (gecer('avukat', 'hukuk')) return 'LegalService';
  if (gecer('emlak', 'gayrimenkul')) return 'RealEstateAgent';

  // Hizmetin fiziksel bir dukkana bagli olmadigi meslekler. Musteri ofise
  // gelmiyor, is uzaktan yurutuluyor — LocalBusiness yanlis sinyal verir.
  if (
    gecer('web tasar', 'web sitesi', 'seo', 'yazilim', 'dijital pazarlama',
      'reklam ajans', 'grafik tasar', 'danismanlik', 'muhasebe', 'mali musavir')
  ) {
    return 'ProfessionalService';
  }

  return 'LocalBusiness';
}

const GUN_ADLARI = [
  'https://schema.org/Sunday',
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
] as const;

/** undefined ve bos dizileri temizler — JSON-LD'de bos alan istemiyoruz. */
function temizle(nesne: Ld): Ld {
  const sonuc: Ld = {};
  for (const [anahtar, deger] of Object.entries(nesne)) {
    if (deger === undefined || deger === null) continue;
    if (Array.isArray(deger) && deger.length === 0) continue;
    if (typeof deger === 'string' && deger.trim() === '') continue;
    sonuc[anahtar] = deger;
  }
  return sonuc;
}

/**
 * Site uzerinde TOPLANMIS yorumlardan aggregateRating uretir.
 *
 * IKI SEYI BILEREK DISLIYOR:
 *
 *   1. gbpMetrikleri — Google isletme kaydindaki toplu puan
 *   2. kaynak === 'google' olan referanslar — Google'dan cekilmis yorumlar
 *
 * Sebep: Google, isletmenin kendi sitesinde kendisi hakkinda yayinladigi
 * ("self-serving") ve ucuncu taraftan toplanmis puanlarin isaretlemede
 * kullanilmasini yasakliyor; ihlali manuel islem riski tasiyor.
 *
 * Google yorumlari sayfada GOSTERILEBILIR (atifla birlikte) — sadece
 * yapisal veri isaretlemesine girmez. Ikisi ayri sey.
 */
function puanOzeti(isletme: IsletmeTaslak): Ld | undefined {
  const puanlilar = isletme.referanslar.filter(
    (r) => typeof r.puan === 'number' && r.kaynak !== 'google',
  );
  if (!puanlilar.length) return undefined;

  const toplam = puanlilar.reduce((acc, r) => acc + (r.puan ?? 0), 0);

  return {
    '@type': 'AggregateRating',
    ratingValue: Number((toplam / puanlilar.length).toFixed(1)),
    reviewCount: puanlilar.length,
    bestRating: 5,
    worstRating: 1,
  };
}

/**
 * Fiyati PriceSpecification'a cevirir.
 *
 * Onceki hal min VE max birlikte varsa isaretliyordu, aksi halde duz
 * `price` yaziyordu. Bu yanlisti: taban fiyat veren bir hizmette
 * ("18.000 TL'den baslıyor") sadece min oluyor, ve duz `price` Google'a
 * "sabit fiyat 18.000" diye okunuyor. Artik ikisinden biri yetiyor ve
 * hangisi varsa o alan cikiyor.
 *
 * Sadece `not` yazilmis (rakamsiz) fiyatlarda hicbir sey uretmiyor —
 * "ücretsiz keşif" bir PriceSpecification degil.
 */
function fiyatOzelligi(fiyat: Hizmet['fiyat']): Ld | undefined {
  if (!fiyat) return undefined;
  if (fiyat.min === undefined && fiyat.max === undefined) return undefined;

  return temizle({
    '@type': 'PriceSpecification',
    minPrice: fiyat.min,
    maxPrice: fiyat.max,
    priceCurrency: fiyat.paraBirimi,
    unitText: fiyat.birim,
  });
}

/**
 * Ana isletme isaretlemesi. Anasayfaya basilir.
 * Yerel aramalarda ve harita paketinde en cok is yapan tek sinyal bu.
 */
export function isletmeLd(isletme: IsletmeTaslak, dil: Dil, baglam: RotaBaglami): Ld {
  const varsayilan = isletme.diller.varsayilan;
  const anasayfa = kanonik({ tur: 'anasayfa' }, dil, baglam);
  const adres = isletme.adresler[0];

  const sosyalBaglantilar = [
    ...Object.values(isletme.sosyal).filter((v): v is string => Boolean(v)),
    isletme.seo.gbpUrl,
  ].filter((v): v is string => Boolean(v));

  return temizle({
    '@context': 'https://schema.org',
    '@type': schemaTipi(isletme.sektor),
    '@id': `${anasayfa}#isletme`,
    name: isletme.ad,
    legalName: isletme.yasalAd,
    description: metin(isletme.ozet, dil, varsayilan),
    url: anasayfa,
    telephone: isletme.iletisim.telefon,
    email: isletme.iletisim.eposta,
    foundingDate: isletme.kurulusYili ? String(isletme.kurulusYili) : undefined,

    image: isletme.galeri.slice(0, 6).map((g) => g.url),
    logo: isletme.marka?.logo?.url,

    address: adres
      ? temizle({
          '@type': 'PostalAddress',
          streetAddress: adres.sokak,
          addressLocality: adres.ilce ?? adres.il,
          addressRegion: adres.il,
          postalCode: adres.postaKodu,
          addressCountry: adres.ulke,
        })
      : undefined,

    geo:
      adres?.enlem !== undefined && adres.boylam !== undefined
        ? { '@type': 'GeoCoordinates', latitude: adres.enlem, longitude: adres.boylam }
        : undefined,

    hasMap: adres?.mapsUrl,

    areaServed: isletme.hizmetVerilenBolgeler.map((b) => ({
      '@type': b.tur === 'ulke' ? 'Country' : 'AdministrativeArea',
      name: b.ad,
    })),

    openingHoursSpecification: isletme.calismaSaatleri
      .filter((s) => !s.kapali && s.acilis && s.kapanis)
      .map((s) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: GUN_ADLARI[s.gun],
        opens: s.acilis,
        closes: s.kapanis,
      })),

    // Fiyati olan hizmet fiyatiyla birlikte cikiyor. `price` yerine
    // `priceSpecification.minPrice` kullaniliyor: elimizdeki rakam bir
    // taban ("… TL'den baslıyor"), sabit fiyat degil. Duz `price` yazmak
    // Google'a sabit fiyat soyler ve yaniltir.
    makesOffer: isletme.hizmetler.map((h) =>
      temizle({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: metin(h.ad, dil, varsayilan) },
        priceSpecification: fiyatOzelligi(h.fiyat),
      }),
    ),

    aggregateRating: puanOzeti(isletme),
    sameAs: sosyalBaglantilar,
  });
}

/** Tek bir hizmet sayfasi icin Service isaretlemesi. */
export function hizmetLd(
  isletme: IsletmeTaslak,
  hizmet: Hizmet,
  dil: Dil,
  baglam: RotaBaglami,
): Ld {
  const varsayilan = isletme.diller.varsayilan;
  const anasayfa = kanonik({ tur: 'anasayfa' }, dil, baglam);
  const sayfa = kanonik({ tur: 'hizmet', slug: hizmet.slug }, dil, baglam);

  return temizle({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${sayfa}#hizmet`,
    name: metin(hizmet.ad, dil, varsayilan),
    description: metin(hizmet.aciklama ?? hizmet.ozet, dil, varsayilan),
    url: sayfa,
    serviceType: metin(hizmet.ad, dil, varsayilan),
    provider: { '@id': `${anasayfa}#isletme` },
    areaServed: isletme.hizmetVerilenBolgeler.map((b) => ({
      '@type': b.tur === 'ulke' ? 'Country' : 'AdministrativeArea',
      name: b.ad,
    })),
    image: hizmet.gorseller.slice(0, 4).map((g) => g.url),
    offers: hizmet.fiyat
      ? temizle({
          '@type': 'Offer',
          priceCurrency: hizmet.fiyat.paraBirimi,
          priceSpecification: fiyatOzelligi(hizmet.fiyat),
        })
      : undefined,
  });
}

/**
 * SSS isaretlemesi.
 *
 * Dürüst not: Google 2023'ten beri FAQ zengin sonuclarini yalnizca resmi
 * kurum ve saglik sitelerinde gosteriyor. Yani buradan yildizli sonuc
 * beklemeyin. Yine de isaretlemeye deger: Bing/Yandex kullaniyor, ve
 * Google icerigi anlamlandirmada hala degerlendiriyor.
 */
export function sssLd(sorular: Sss[], dil: Dil, varsayilanDil: Dil): Ld | undefined {
  if (!sorular.length) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sorular.map((s) => ({
      '@type': 'Question',
      name: metin(s.soru, dil, varsayilanDil),
      acceptedAnswer: {
        '@type': 'Answer',
        text: metin(s.cevap, dil, varsayilanDil),
      },
    })),
  };
}

/** Kirinti navigasyonu. Arama sonucunda URL yerine okunabilir yol gosteriyor. */
export function kirintiLd(
  adimlar: { ad: string; sayfa: SayfaTuru }[],
  dil: Dil,
  baglam: RotaBaglami,
): Ld | undefined {
  if (adimlar.length < 2) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: adimlar.map((adim, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: adim.ad,
      item: kanonik(adim.sayfa, dil, baglam),
    })),
  };
}

/** Site genelinde WebSite isaretlemesi. */
export function siteLd(isletme: IsletmeTaslak, dil: Dil, baglam: RotaBaglami): Ld {
  const anasayfa = kanonik({ tur: 'anasayfa' }, dil, baglam);

  return temizle({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${anasayfa}#site`,
    name: isletme.ad,
    url: anasayfa,
    inLanguage: dil,
    publisher: { '@id': `${anasayfa}#isletme` },
  });
}

/**
 * Anasayfa icin butun isaretlemeleri tek @graph altinda toplar.
 * Ayri ayri script etiketleri basmak yerine bunu kullan — varliklar
 * arasindaki @id referanslari boylece dogru cozuluyor.
 */
export function anasayfaGrafi(isletme: IsletmeTaslak, dil: Dil, baglam: RotaBaglami): Ld {
  const parcalar: Ld[] = [
    isletmeLd(isletme, dil, baglam),
    siteLd(isletme, dil, baglam),
  ];

  const sss = sssLd(isletme.sss, dil, isletme.diller.varsayilan);
  if (sss) parcalar.push(sss);

  return {
    '@context': 'https://schema.org',
    '@graph': parcalar.map(({ '@context': _atilan, ...geri }) => geri),
  };
}

/** JSON-LD'yi <script> icine basmaya hazir metin. XSS icin </script> kacisi dahil. */
export function ldMetni(ld: Ld): string {
  return JSON.stringify(ld).replace(/</g, '\\u003c');
}
