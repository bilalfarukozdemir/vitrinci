import { trNormalize, type Marka } from '@studio/data';

/**
 * Sektor sablonlari.
 *
 * Maps taramasindan gelen veri cok az: ad, adres, telefon, puan, yorum sayisi.
 * Bununla kurulan bir demo bos duruyor ve ise yaramiyor. Sablonlar iskeleti
 * dolduruyor — sen sadece duzeltiyorsun.
 *
 * ONEMLI: buradaki hizmet metinleri VARSAYIM. Baskasinin isletmesi hakkinda
 * iddia uretiyorlar. Demo, `kaynak.musteriOnayli` true olana kadar sayfada
 * gorunur bir "taslak" serididi tasiyor ve arama motorlarina kapali kaliyor.
 */

export type Sablon = {
  ad: string;
  /** Google'in gorunur kategori adina uygulanan desen (trNormalize edilmis, ASCII). */
  esles: RegExp;
  vaat: string;

  /**
   * Bu sektorde TIPIK hizmetler.
   *
   * VERIYE YAZILMAZ. Uretilen dosyanin basligina ONERI olarak basilir,
   * `hizmetler` alani bos kalir. Dogru olanlari yorumlari okuyup sen secersin.
   *
   * Sebep: gercek tarama gosterdi ki Google'in `general_contractor` etiketi
   * her seyi kapsiyor — "Hendek teknik" bu etiketi tasiyor ama yorumlarina
   * gore dogalgaz donusumu ve kombi tamiri yapiyor. Tur dogru olsa bile
   * ne yaptiklarini soylemiyor.
   */
  hizmetOnerileri: { slug: string; ad: string; ozet: string; anahtarKelimeler: string[] }[];

  sss: { soru: string; cevap: string }[];

  /**
   * Bolum basliklarini sektore gore degistirir.
   *
   * NEDEN GEREKTI: insaat sablonlarinda "Ne yapiyoruz / Islerimizden /
   * Kesif icin arayin" dogru calisiyordu. Otelde ucu de yanlis — otelin
   * "isi" yok, "odasi" var; kesfe gelmiyorsun, rezervasyon yapiyorsun.
   * Yanlis baslik, sayfanin baska bir sektor icin yazildigini ele veriyor.
   *
   * Bos birakilirsa insaat varsayilanlari kullaniliyor.
   */
  basliklar?: { hizmetler?: string; galeri?: string; iletisim?: string };

  marka: Marka;
  markaKoyu: Marka;
};

/*
 * PALET NOTU
 *
 * Bu demolar Anadolu'daki geleneksel isletme sahiplerine gonderiliyor.
 * O kitlede "pahali" sinyali veren sey koyu/derin zemin + sicak metalik
 * aksan (bronz, amber, altin). Modern tasarim dunyasinda populer olan soluk
 * pastel tonlar orada "eksik kalmis" gibi duruyor.
 *
 * Ikinci ve daha onemli sebep: fotograflar Google isletme kaydindan geliyor,
 * yani telefonla cekilmis. Acik krem zeminde soluk goruniyorlar; derin
 * zeminde ve sicak aksanla cok daha iyi duruyorlar. Demonun isi onlarin
 * isini pahali gostermek.
 */

const yesil: Marka = {
  renkler: {
    ana: '#2c6444', vurgu: '#b8873f', arkaplan: '#f7f5f0',
    yuzey: '#ffffff', metin: '#15201a', soluk: '#5a675e',
  },
  kose: 'yumusak',
  ton: 'sicak',
};

const yesilKoyu: Marka = {
  renkler: {
    ana: '#7fc99a', vurgu: '#e0b160', arkaplan: '#0b100d',
    yuzey: '#141b16', metin: '#e8efe9', soluk: '#8ba192',
  },
  kose: 'yumusak',
  ton: 'sicak',
};

const bronz: Marka = {
  renkler: {
    ana: '#8a5f2c', vurgu: '#8a5f2c', arkaplan: '#f8f5f0',
    yuzey: '#ffffff', metin: '#1b1713', soluk: '#6b6157',
  },
  kose: 'keskin',
  ton: 'premium',
};

const bronzKoyu: Marka = {
  renkler: {
    ana: '#d8a55a', vurgu: '#d8a55a', arkaplan: '#100e0b',
    yuzey: '#1a1713', metin: '#efe9e0', soluk: '#9d9285',
  },
  kose: 'keskin',
  ton: 'premium',
};

const lacivert: Marka = {
  renkler: {
    ana: '#1e3a5f', vurgu: '#c08a2e', arkaplan: '#f6f7f9',
    yuzey: '#ffffff', metin: '#12171f', soluk: '#5a6470',
  },
  kose: 'keskin',
  ton: 'kurumsal',
};

const lacivertKoyu: Marka = {
  renkler: {
    ana: '#8fb4e0', vurgu: '#e2b055', arkaplan: '#0a0e14',
    yuzey: '#121821', metin: '#e7ebf1', soluk: '#8792a0',
  },
  kose: 'keskin',
  ton: 'kurumsal',
};

const amber: Marka = {
  renkler: {
    ana: '#a86a12', vurgu: '#a86a12', arkaplan: '#f8f7f4',
    yuzey: '#ffffff', metin: '#191713', soluk: '#66605a',
  },
  kose: 'keskin',
  ton: 'teknik',
};

const amberKoyu: Marka = {
  renkler: {
    ana: '#e5a83e', vurgu: '#e5a83e', arkaplan: '#0f0e0b',
    yuzey: '#191713', metin: '#ede9e3', soluk: '#948d84',
  },
  kose: 'keskin',
  ton: 'teknik',
};

/* Konaklama: sicak topraksi. Konak/butik otel fotograflari ahsap ve tas
   agirlikli; bronz aksan onlarin uzerinde oturuyor, mavi/gri sogutuyor. */
const toprak: Marka = {
  renkler: {
    ana: '#7a5c3e', vurgu: '#b8873f', arkaplan: '#faf7f2',
    yuzey: '#ffffff', metin: '#1d1710', soluk: '#6b6055',
  },
  kose: 'yumusak',
  ton: 'premium',
};
const toprakKoyu: Marka = {
  renkler: {
    ana: '#d8b78a', vurgu: '#e8c99a', arkaplan: '#100d09',
    yuzey: '#1c1712', metin: '#f0e9df', soluk: '#9c9186',
  },
  kose: 'yumusak',
  ton: 'premium',
};

/* Yeme-icme: derin kiremit. Yemek fotograflarinda sicak kirmizi istah
   ve samimiyet sinyali veriyor; ayni sebeple lokanta tabelalari kirmizi. */
const kiremit: Marka = {
  renkler: {
    ana: '#8c3b2a', vurgu: '#c2703f', arkaplan: '#faf6f3',
    yuzey: '#ffffff', metin: '#20120d', soluk: '#6d5d55',
  },
  kose: 'yumusak',
  ton: 'sicak',
};
const kiremitKoyu: Marka = {
  renkler: {
    ana: '#e08a66', vurgu: '#eaa878', arkaplan: '#120c0a',
    yuzey: '#1e1512', metin: '#f2e8e3', soluk: '#a1908a',
  },
  kose: 'yumusak',
  ton: 'sicak',
};

export const SABLONLAR: Sablon[] = [
  {
    ad: 'Peyzaj ve bahçe',
    esles: /peyzaj|bahce|cim|fidan|sulama|botanik/,
    vaat: 'Ücretsiz keşif, sabit fiyat',
    marka: yesil,
    markaKoyu: yesilKoyu,
    hizmetOnerileri: [
      {
        slug: 'bahce-duzenleme',
        ad: 'Bahçe düzenleme',
        ozet: 'Boş alandan bitmiş bahçeye: zemin hazırlığı, bitki seçimi, çim serimi ve sulama.',
        anahtarKelimeler: ['bahçe düzenleme', 'peyzaj firması'],
      },
      {
        slug: 'cim-serme',
        ad: 'Çim serme',
        ozet: 'Rulo çim ve tohumlu çim uygulaması, zemin tesviyesi ve ilk bakım dönemi dahil.',
        anahtarKelimeler: ['rulo çim', 'çim serme'],
      },
      {
        slug: 'otomatik-sulama',
        ad: 'Otomatik sulama sistemi',
        ozet: 'Bahçe ölçüsüne göre projelendirilen damlama ve fıskiye sistemleri.',
        anahtarKelimeler: ['otomatik sulama sistemi'],
      },
      {
        slug: 'agac-bitki',
        ad: 'Ağaç ve bitki uygulaması',
        ozet: 'İklime ve toprağa uygun bitki seçimi, dikim ve tutma garantisi.',
        anahtarKelimeler: ['ağaç dikimi', 'fidan'],
      },
    ],
    sss: [
      { soru: 'Keşif ücretli mi?', cevap: 'Hayır. Yerinde bakıp ölçü alıyoruz, fiyat ondan sonra çıkıyor.' },
      { soru: 'İş ne kadar sürer?', cevap: 'Ortalama bir bahçe bir ila iki hafta. Ölçü ve mevsim süreyi değiştiriyor.' },
      { soru: 'Bakım da yapıyor musunuz?', cevap: 'Evet, isteğe bağlı dönemsel bakım anlaşması yapıyoruz.' },
    ],
  },
  {
    ad: 'Taş ve zemin',
    esles: /kilit tasi|parke tas|dogal tas|mermer|granit|zemin|beton avlu|istinat/,
    vaat: 'Ücretsiz keşif, sabit fiyat',
    marka: bronz,
    markaKoyu: bronzKoyu,
    hizmetOnerileri: [
      {
        slug: 'kilit-tasi-doseme',
        ad: 'Kilit taşı döşeme',
        ozet: 'Avlu, bahçe yolu ve otopark için parke taşı döşeme. Zemin hazırlığından bordüre kadar.',
        anahtarKelimeler: ['kilit taşı döşeme', 'parke taşı'],
      },
      {
        slug: 'dogal-tas',
        ad: 'Doğal taş uygulama',
        ozet: 'Duvar ve zemin kaplamalarında doğal taş işçiliği.',
        anahtarKelimeler: ['doğal taş uygulama', 'taş duvar'],
      },
      {
        slug: 'beton-avlu',
        ad: 'Beton avlu dökümü',
        ozet: 'Baskı beton ve düz beton avlu, drenaj eğimi hesaplanarak.',
        anahtarKelimeler: ['beton avlu', 'baskı beton'],
      },
      {
        slug: 'istinat-duvari',
        ad: 'İstinat duvarı',
        ozet: 'Betonarme ve taş istinat duvarı, zemin etüdüne göre.',
        anahtarKelimeler: ['istinat duvarı'],
      },
    ],
    sss: [
      { soru: 'Metrekare fiyatı nedir?', cevap: 'Malzemeye ve zemin durumuna göre değişiyor. Keşif sonrası sabit fiyat veriyoruz.' },
      { soru: 'Ne kadar dayanır?', cevap: 'Doğru zemin hazırlığıyla döşenen taş on yıllarca sorun çıkarmıyor.' },
      { soru: 'Kışın çalışıyor musunuz?', cevap: 'Don olmayan günlerde evet. Beton işleri hava şartlarına bağlı.' },
    ],
  },
  {
    ad: 'İnşaat ve tadilat',
    esles: /insaat|muteahhit|tadilat|dekorasyon|yapi|prefabrik|cati|hafriyat|beton|mimarlik|muhendislik/,
    vaat: 'Yerinde keşif, yazılı teklif',
    marka: lacivert,
    markaKoyu: lacivertKoyu,
    hizmetOnerileri: [
      {
        slug: 'komple-tadilat',
        ad: 'Komple tadilat',
        ozet: 'Daire ve iş yeri tadilatı: elektrik, tesisat, zemin, boya — tek elden.',
        anahtarKelimeler: ['komple tadilat', 'daire tadilat'],
      },
      {
        slug: 'kaba-insaat',
        ad: 'Kaba inşaat',
        ozet: 'Temelden kaba yapıya kadar betonarme imalat.',
        anahtarKelimeler: ['kaba inşaat', 'müteahhit'],
      },
      {
        slug: 'cati-uygulama',
        ad: 'Çatı uygulaması',
        ozet: 'Çatı yenileme, izolasyon ve su yalıtımı.',
        anahtarKelimeler: ['çatı ustası', 'çatı yenileme'],
      },
      {
        slug: 'dis-cephe',
        ad: 'Dış cephe ve mantolama',
        ozet: 'Isı yalıtımı, dış cephe kaplama ve boya.',
        anahtarKelimeler: ['mantolama', 'dış cephe'],
      },
    ],
    sss: [
      { soru: 'Keşif ücretli mi?', cevap: 'Hayır. Yerinde bakıp yazılı teklif veriyoruz.' },
      { soru: 'Malzeme dahil mi?', cevap: 'İsterseniz anahtar teslim, isterseniz sadece işçilik. İkisini de yapıyoruz.' },
      { soru: 'İş bitince fatura veriyor musunuz?', cevap: 'Evet, tüm işlerimiz faturalı.' },
    ],
  },
  {
    // Gercek taramada en buyuk karsiliksiz segment: 1.322 kaydin 121'i yapi
    // malzemesi satiyordu ve hicbir sablona uymuyordu. Bunlar hizmet degil
    // urun satiyor — vaat, SSS ve sayfa tonu tamamen farkli olmali.
    ad: 'Yapı malzemesi satışı',
    esles: /yapi malzeme|insaat malzeme|nalbur|hirdavat|yapi market|boya bayi|seramik|fayans|sihhi tesisat malzeme/,
    vaat: 'Stokta ne var, telefonla öğrenin',
    marka: amber,
    markaKoyu: amberKoyu,
    hizmetOnerileri: [
      {
        slug: 'yapi-malzemeleri',
        ad: 'Yapı malzemeleri',
        ozet: 'Çimento, demir, kereste ve temel inşaat malzemeleri.',
        anahtarKelimeler: ['yapı malzemeleri', 'inşaat malzemesi'],
      },
      {
        slug: 'seramik-fayans',
        ad: 'Seramik ve fayans',
        ozet: 'Banyo, mutfak ve zemin kaplamaları — showroom’da görebilirsiniz.',
        anahtarKelimeler: ['seramik', 'fayans'],
      },
      {
        slug: 'boya',
        ad: 'Boya ve yardımcı ürünler',
        ozet: 'İç ve dış cephe boyaları, renk karışımı.',
        anahtarKelimeler: ['boya bayi', 'dış cephe boyası'],
      },
      {
        slug: 'tesisat',
        ad: 'Tesisat malzemeleri',
        ozet: 'Su, ısıtma ve sıhhi tesisat ürünleri.',
        anahtarKelimeler: ['sıhhi tesisat malzemeleri'],
      },
    ],
    sss: [
      { soru: 'Stokta var mı?', cevap: 'Arayın, bakıp hemen söyleyelim. Depoda olmayan ürünü de kısa sürede temin ediyoruz.' },
      { soru: 'Nakliye yapıyor musunuz?', cevap: 'Evet, bölge içi teslimat yapıyoruz. Mesafeye göre ücretlendiriliyor.' },
      { soru: 'Toptan fiyat veriyor musunuz?', cevap: 'Müteahhit ve usta müşterilerimize ayrı fiyat uyguluyoruz.' },
    ],
  },

/**
 * Google tur etiketlerinden hizmet sablonuna esleme.
 * Places API (New) tur adlari degisebiliyor, o yuzden metin esleme yedekte kaliyor.
 */
  // ─────────────────────────────────────────────── 4 · KONAKLAMA
  {
    ad: 'Konaklama',
    esles: /otel|konak|pansiyon|butik otel|apart|bungalov|misafirhane/,
    // Konaklamada karar anini belirleyen sey fiyat degil GUVEN ve
    // DOGRUDAN ULASIM. Aracilardan gelen misafir zaten komisyon
    // odetiyor; vaat, dogrudan aramanin karsiligini soyluyor.
    vaat: 'Doğrudan arayın, aradaki komisyon sizde kalsın',
    marka: toprak,
    markaKoyu: toprakKoyu,
    basliklar: {
      hizmetler: 'Odalar ve olanaklar',
      galeri: 'Mekândan',
      iletisim: 'Rezervasyon için arayın',
    },
    hizmetOnerileri: [
      {
        slug: 'odalar',
        ad: 'Odalar',
        ozet: 'Oda tipleri, kapasite ve manzara. Fotoğraflarla birlikte hangisinin size uyduğunu görün.',
        anahtarKelimeler: ['otel odası', 'konaklama'],
      },
      {
        slug: 'kahvalti',
        ad: 'Kahvaltı ve mutfak',
        ozet: 'Yöresel ürünlerle serpme kahvaltı; talep üzerine akşam yemeği.',
        anahtarKelimeler: ['serpme kahvaltı', 'otel kahvaltısı'],
      },
      {
        slug: 'cevre',
        ad: 'Çevrede ne var',
        ozet: 'Yürüme mesafesindeki gezilecek yerler ve ulaşım süreleri.',
        anahtarKelimeler: ['gezilecek yerler', 'konaklama çevre'],
      },
      {
        slug: 'ozel-gun',
        ad: 'Özel gün ve grup',
        ozet: 'Küçük kutlamalar, aile buluşmaları ve grup rezervasyonları için tüm tesis.',
        anahtarKelimeler: ['grup rezervasyonu', 'özel gün'],
      },
    ],
    sss: [
      { soru: 'Giriş ve çıkış saatleri nedir?', cevap: 'Giriş 14:00, çıkış 12:00. Erken giriş ya da geç çıkış için arayın, müsaitlik varsa ayarlıyoruz.' },
      { soru: 'Kahvaltı fiyata dahil mi?', cevap: 'Evet, konaklama fiyatına kahvaltı dahil.' },
      { soru: 'Otopark var mı?', cevap: 'Evet, misafirlerimize ücretsiz otopark.' },
      { soru: 'Evcil hayvan kabul ediyor musunuz?', cevap: 'Arayıp sorun; oda tipine göre değerlendiriyoruz.' },
      { soru: 'Rezervasyonu nasıl yaptırırım?', cevap: 'Telefonla ya da WhatsApp\'tan. Doğrudan bize yaptırdığınızda aracı komisyonu olmuyor.' },
      { soru: 'İptal şartları neler?', cevap: 'Girişe birkaç gün kala yapılan iptallerde ücret almıyoruz. Tarihi söyleyin, net şartı baştan konuşalım.' },
    ],
  },

  // ─────────────────────────────────────────────── 5 · YEME-ICME
  {
    ad: 'Yeme-içme',
    esles: /restoran|restaurant|lokanta|kafe|cafe|kahvalti salonu|et mangal|balik/,
    vaat: 'Yolunuz düşerse yer ayırtın',
    marka: kiremit,
    markaKoyu: kiremitKoyu,
    basliklar: {
      hizmetler: 'Mutfağımız',
      galeri: 'Mekândan',
      iletisim: 'Yer ayırtmak için arayın',
    },
    hizmetOnerileri: [
      {
        slug: 'mutfak',
        ad: 'Mutfak',
        ozet: 'Öne çıkan tabaklar ve mutfağın karakteri — ne yediğinizi bilerek gelin.',
        anahtarKelimeler: ['restoran', 'lokanta'],
      },
      {
        slug: 'mekan',
        ad: 'Mekân',
        ozet: 'Oturma düzeni, kapasite ve bahçe/teras durumu.',
        anahtarKelimeler: ['bahçeli restoran', 'mekan'],
      },
      {
        slug: 'grup-kutlama',
        ad: 'Grup ve kutlama',
        ozet: 'Kalabalık masalar, doğum günü ve iş yemekleri için önceden yer ayırtma.',
        anahtarKelimeler: ['grup yemeği', 'kutlama'],
      },
      {
        slug: 'ulasim',
        ad: 'Ulaşım ve otopark',
        ozet: 'Nasıl gelinir, ne kadar sürer, otopark var mı.',
        anahtarKelimeler: ['yol tarifi', 'otopark'],
      },
    ],
    sss: [
      { soru: 'Rezervasyon gerekiyor mu?', cevap: 'Hafta içi genelde gerekmiyor. Hafta sonu ve kalabalık masalar için arayıp yer ayırtmanızı öneririz.' },
      { soru: 'Otopark var mı?', cevap: 'Evet, misafirlerimize otopark imkânı sunuyoruz.' },
      { soru: 'Kaç kişilik grupları alıyorsunuz?', cevap: 'Arayın, tarihi ve kişi sayısını söyleyin — düzeni ona göre kuruyoruz.' },
      { soru: 'Çocuklu aileler için uygun mu?', cevap: 'Evet. Mama sandalyesi ve çocukların rahat edeceği bir alan var.' },
    ],
  },
];

const TUR_ESLEME: Record<string, number> = {
  landscaper: 0,
  landscape_designer: 0,
  gardener: 0,
  general_contractor: 2,
  construction_company: 2,
  roofing_contractor: 2,
  plumber: 2,
  electrician: 2,
  painter: 2,
  // Yapi malzemesi perakendesi — genel magaza kontrolunden ONCE eslesiyor.
  // Konaklama ve yeme-icme, MAGAZA_DESENI kontrolunden ONCE eslesiyor.
  // `restaurant` ve `lodging` magaza desenine takilmiyor ama tur
  // eslemesinin once gelmesi hem daha hizli hem daha acik.
  hotel: 4,
  lodging: 4,
  guest_house: 4,
  bed_and_breakfast: 4,
  resort_hotel: 4,
  motel: 4,
  campground: 4,
  restaurant: 5,
  cafe: 5,
  bar: 5,
  meal_takeaway: 5,
  bakery: 5,
  building_materials_store: 3,
  home_improvement_store: 3,
  hardware_store: 3,
  paint_store: 3,
};

/**
 * Perakende / magaza turleri. Bunlar HIZMET isletmesi degil — sablon
 * uygulanmaz. AYBAHCEM tam olarak buraya dusuyordu: "bahce duzenleme"
 * aramasinda cikmisti ama bahce MOBILYASI magazasiydi ve sablon ona
 * yapmadigi hizmetleri yazdi.
 */
const MAGAZA_DESENI = /_store$|_shop$|^store$|^shopping|wholesaler|supplier|dealer/;
const MAGAZA_METNI = /magaza|magazasi|market|bayi|toptan|satis noktasi|showroom|magza/;

export type SablonSonucu =
  | { sablon: Sablon; gerekce: string }
  | { sablon: null; gerekce: string };

/**
 * Sablon secer — EMIN DEGILSE SECMEZ.
 *
 * Onceki surum arama terimine bakiyordu ve hicbir zaman bos donmuyordu;
 * sonuc olarak baskasinin isletmesi hakkinda yanlis iddia uretiyordu.
 * Simdi karar sirasi: magaza mi? → tur etiketi → metin → bilinmiyor.
 *
 * `sablon: null` dondugunde ureteC hizmetleri BOS birakiyor ve senden
 * doldurmani istiyor. Tahmin etmiyor.
 */
export function sablonSec(googleTurleri: string[] = [], sektor?: string): SablonSonucu {
  const turler = googleTurleri.map((t) => t.toLowerCase());
  const metin = trNormalize(sektor);
  const yapiMarket = SABLONLAR[3]!;

  // 1. Bilinen tur etiketi — en guvenilir sinyal. Yapi malzemesi turleri de
  //    burada; genel magaza kontrolunden ONCE gelmeleri gerekiyor, yoksa
  //    "building_materials_store" perakende diye elenirdi.
  for (const tur of turler) {
    const indeks = TUR_ESLEME[tur];
    if (indeks !== undefined) return { sablon: SABLONLAR[indeks]!, gerekce: `tür: ${tur}` };
  }

  // 2. Yapi malzemesi metni — genel "magaza" kontrolune yakalanmadan once.
  //    "Yapı Malzemeleri Mağazası" ifadesi ikisine birden uyuyor.
  if (yapiMarket.esles.test(metin)) {
    return { sablon: yapiMarket, gerekce: `kategori: "${sektor}"` };
  }

  // 3. Baska bir perakende turu mu? Sablonumuz yok, tahmin de etmiyoruz.
  //    AYBAHCEM buraya dusuyordu: bahce MOBILYASI magazasi, "bahce duzenleme"
  //    aramasindan gelmisti ve peyzaj sablonu yiyordu.
  const magazaTuru = turler.find((t) => MAGAZA_DESENI.test(t));
  if (magazaTuru) return { sablon: null, gerekce: `perakende (${magazaTuru})` };
  if (MAGAZA_METNI.test(metin)) return { sablon: null, gerekce: `perakende ("${sektor}")` };

  // 4. Google'in gorunur kategori adi.
  const metinden = SABLONLAR.find((x) => x.esles.test(metin));
  if (metinden) return { sablon: metinden, gerekce: `kategori: "${sektor}"` };

  // 5. Bilmiyoruz. Tahmin YOK.
  return { sablon: null, gerekce: sektor ? `tanınmayan kategori: "${sektor}"` : 'kategori bilgisi yok' };
}

/** Sablon secilemedigi durumda kullanilan notr palet. */
export const NOTR_MARKA: Marka = {
  renkler: {
    ana: '#3f3a33', vurgu: '#a8762e', arkaplan: '#f8f7f4',
    yuzey: '#ffffff', metin: '#191714', soluk: '#655f58',
  },
  kose: 'yumusak',
  ton: 'kurumsal',
};

export const NOTR_MARKA_KOYU: Marka = {
  renkler: {
    ana: '#cbbfae', vurgu: '#d8a55a', arkaplan: '#0e0d0b',
    yuzey: '#171512', metin: '#eae7e2', soluk: '#8f8880',
  },
  kose: 'yumusak',
  ton: 'kurumsal',
};
