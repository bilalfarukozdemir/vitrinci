/**
 * Nis tanimlari. Her nis icin birden fazla arama sorgusu var, cunku Google Maps
 * tek bir terimde isletmelerin ancak bir kismini dondurur. Es anlamlilarla tarayip
 * sonuclari birlestirmek kapsami 3-4 katina cikarir.
 */
export const NISLER = {
  insaat: {
    ad: 'İnşaat / Yapı / Peyzaj',
    not: 'Tek iş değeri 100k+. Hızlı kapanır, WhatsApp ile çalışırlar, birbirlerini tanırlar.',
    // Bu nise ozgu eleme. Otomotiv kendi nisinin hedefi — burada gurultu.
    // Kaliplar adNormalize()'dan gecmis metne karsi calisir: ASCII, kucuk harf.
    blokAdKaliplari: [
      /oto kurtarma|\bcekici\b|oto yikama|oto servis|oto elektrik|\blastik\b|kaporta|ekspertiz|rent a car|arac kiralama/,
      /nakliyat|evden eve|\bkurye\b|\bkargo\b/,
      /\bemlak\b|emlakci|gayrimenkul|danismanlik ofisi/,
      /akaryakit|petrol ofisi|\bbenzin\b/,
      // Gida/mobilya/tekstil: kurtarma kurali sayesinde "<marka> GRUP INSAAT
      // DEMIR CELIK GIDA" gibi karma unvanlar listede kalir, saf gida
      // isletmesi (koy bakkali, toptanci) elenir.
      /\bgida\b|\bicecek\b|toptan gida|bakliyat|\bunlu mamul\b/,
      /\bmobilya\b|beyaz esya|\bhali\b|perde ve/,
      /\bderi\b|\btekstil\b|konfeksiyon|kirtasiye|elektronik market/,
    ],
    /**
     * Kurtarma kurali: nise ozgu blok kaliplarindan birine takilsa bile, adinda
     * bu terimlerden biri geciyorsa isletme listede kalir.
     *
     * Sebep: "<marka> GRUP INSAAT EMLAK" hem insaat hem emlak yapiyor ve gercek
     * bir prospect. Emlak kalibi onu eleyecekti. Genel kara liste (lokanta,
     * belediye, turbe) bu kuraldan ETKILENMEZ — orada kurtarma yok.
     */
    kurtarmaKaliplari: [
      /insaat|muteahhit|\byapi\b|yapim|peyzaj|\bbeton\b|hafriyat|prefabrik|tadilat|mimarlik|\bcati\b|taahhut|dekorasyon|\bkilit tasi\b|dogal tas/,
    ],
    sorgular: [
      'müteahhit',
      'inşaat firması',
      'peyzaj firması',
      'bahçe düzenleme',
      'kilit taşı döşeme',
      'doğal taş uygulama',
      'hazır beton',
      'prefabrik yapı',
      'çatı ustası',
      'istinat duvarı',
    ],
  },

  ihracatci: {
    ad: 'İhracatçı / İmalatçı',
    not: 'Çok dilli site + teknik SEO. Ticket 80-150k, kapanış yavaş. OSB listeleriyle birlikte kullan.',
    sorgular: [
      'makine imalat',
      'plastik enjeksiyon',
      'metal işleme',
      'kalıp imalatı',
      'tekstil üretim',
      'ambalaj üretimi',
      'kimya sanayi',
      'otomotiv yan sanayi',
      'mobilya imalat',
    ],
    // Bu niste cok dillilik en buyuk satis argumani; denetimde ekstra agirlik alir.
    cokDilOnemli: true,
  },

  klinik: {
    ad: 'Sağlık / Estetik',
    not: 'Reklam kısıtlı olduğu için SEO neredeyse tek kanal. Ticket orta-yüksek, tabela hassasiyeti var.',
    sorgular: [
      'diş kliniği',
      'ağız ve diş sağlığı',
      'estetik merkezi',
      'fizik tedavi merkezi',
      'göz merkezi',
      'saç ekim merkezi',
      'veteriner kliniği',
    ],
  },

  otomotiv: {
    ad: 'Otomotiv / Servis',
    not: 'Yerel arama + harita ağırlıklı. Ticket düşük ama hacim yüksek, hızlı referans üretir.',
    sorgular: [
      'oto servis',
      'oto kaporta boya',
      'lastik oto servis',
      'oto elektrik',
      'araç kiralama',
      'oto ekspertiz',
    ],
  },

  turizm: {
    ad: 'Turizm / Konaklama',
    not: 'Çok dilli + rezervasyon akışı. Sezonluk, teklifi kış aylarında götür.',
    sorgular: [
      'butik otel',
      'bungalov',
      'apart otel',
      'tatil köyü',
      'restoran',
    ],
  },
};

/**
 * Google Maps Text Search anlamsal esleme yapiyor: sorguya tam uymayan ama
 * cevredeki populer yerleri de donduruyor. "bahce duzenleme" aramasi Sunnet Golu
 * Tabiat Parki'ni, "kilit tasi doseme" aramasi koltuk doseme atolyesini getiriyor
 * (Turkce "doseme" es sesli). Bu isletmeler yorum sayilari devasa oldugu icin
 * canlilik skorunu tavana vurup listenin tepesine cikiyor.
 *
 * Cozum iki katmanli: once Google'in dondurdugu yer turlerine gore ele,
 * sonra ad kaliplariyla kalani temizle.
 */
/**
 * HIC KIMSENIN MUSTERISI OLMAYANLAR — her niste elenir.
 *
 * Park, gol, turbe, saat kulesi, belediye binasi, okul. Bunlar bir
 * web sitesi satin alamaz; sahibi ya devlet ya da kimse.
 *
 * Bu liste bir kez pahaliya ogrenildi: turizm taramasinda listenin
 * tepesine Aksemseddin Turbesi (1676 yorum), Sunnet Golu (1610) ve
 * Mudurnu Saat Kulesi (1196) cikti. Yorum sayilari devasa, sitesi yok,
 * yani skor formulu onlari mukemmel prospect saniyor.
 */
export const ASLA_PROSPECT = new Set([
  // dogal ve turistik yerler
  'tourist_attraction', 'park', 'national_park', 'state_park', 'hiking_area',
  'natural_feature', 'museum', 'art_gallery', 'historical_landmark',
  'historical_place', 'monument', 'zoo', 'aquarium', 'amusement_park',
  'water_park', 'beach', 'observation_deck', 'plaza', 'garden',
  // ibadet ve anma
  'place_of_worship', 'mosque', 'church', 'synagogue', 'hindu_temple', 'cemetery',
  // kamu
  'local_government_office', 'city_hall', 'courthouse', 'embassy', 'police',
  'fire_station', 'post_office', 'library', 'government_office',
  // egitim ve saglik kurumlari
  'hospital', 'school', 'primary_school', 'secondary_school', 'preschool',
  'university', 'community_center',
  // altyapi ve zincir
  'gas_station', 'bank', 'atm', 'rest_stop', 'parking', 'transit_station',
  'bus_station', 'train_station', 'airport', 'electric_vehicle_charging_station',
]);

/**
 * Geriye donuk uyum: eski ad hala calisiyor. `elemeSebebi` artik hem
 * bunu hem nise ozgu `blokTurler`i kontrol ediyor.
 */
export const IZINSIZ_TURLER = ASLA_PROSPECT;

/**
 * SEKTOR DISI TURLER — nise gore degisir, `NISLER[...].blokTurler`.
 *
 * Bu ayrim sart: eski surumde tek bir liste vardi ve icerigi insaata
 * gore yazilmisti. `restaurant`, `hotel`, `lodging` yasaklyydi — yani
 * TURIZM taramasi tam olarak aradigi isletmeleri eliyordu. Cop gecerken
 * hedef eleniyordu.
 */
const YEME_ICME = [
  'restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'meal_delivery',
  'coffee_shop', 'fast_food_restaurant', 'pizza_restaurant', 'breakfast_restaurant',
  'ice_cream_shop', 'dessert_shop', 'food_court', 'night_club', 'tea_house',
];

const KONAKLAMA = [
  'lodging', 'hotel', 'motel', 'guest_house', 'hostel', 'resort_hotel',
  'bed_and_breakfast', 'cottage', 'campground', 'rv_park', 'farmstay',
];

const KISISEL_BAKIM_SAGLIK = [
  'pharmacy', 'doctor', 'dentist', 'physiotherapist', 'veterinary_care',
  'beauty_salon', 'hair_care', 'hair_salon', 'barber_shop', 'spa',
  'nail_salon', 'gym', 'fitness_center', 'massage',
];

const PERAKENDE_HIZMET = [
  'supermarket', 'grocery_store', 'convenience_store', 'clothing_store',
  'shoe_store', 'jewelry_store', 'book_store', 'pet_store', 'florist',
  'car_dealer', 'car_rental', 'car_wash', 'car_repair', 'travel_agency',
  'insurance_agency', 'lawyer', 'accounting', 'laundry', 'movie_theater',
  'bowling_alley', 'tailor', 'photographer', 'real_estate_agency',
];

const INSAAT_VE_YAPI = [
  'general_contractor', 'roofing_contractor', 'plumber', 'electrician',
  'painter', 'moving_company', 'storage', 'hardware_store',
  'home_improvement_store', 'furniture_store', 'home_goods_store',
];

export const TUR_KUMELERI = {
  YEME_ICME, KONAKLAMA, KISISEL_BAKIM_SAGLIK, PERAKENDE_HIZMET, INSAAT_VE_YAPI,
};

/*
   Nise ozgu blok listeleri BURADA ataniyor, NISLER tanimi icinde degil:
   kumeler dosyada NISLER'den sonra geliyor ve `const` bildirimleri yukari
   tasinmiyor. Kumeleri yukari almak yerine atamayi asagi aldik — boylece
   her nisin neyi neden eledigi tek yerde, yan yana okunuyor.
*/
NISLER.insaat.blokTurler = [
  ...YEME_ICME,
  ...KONAKLAMA,
  ...KISISEL_BAKIM_SAGLIK,
  ...PERAKENDE_HIZMET,
];

NISLER.turizm.blokTurler = [
  ...INSAAT_VE_YAPI,
  ...KISISEL_BAKIM_SAGLIK,
  ...PERAKENDE_HIZMET,
];

/*
   Sektor disi AD kaliplari — tur kumeleriyle ayni mantik, ad tarafinda.
   Kaliplar ASCII kucuk harfe karsi yaziliyor; `adNormalize`den gecmis
   metinle eslesiyorlar.

   Bu uc kalip EVRENSEL listeden AYRILDI, bilerek: eski surumde
   `otel|pansiyon|bungalov|konuk evi` ve `restoran|lokanta|kafe` genel
   kara listedeydi ve nis bagimsiz uygulaniyordu — yani TURIZM taramasi
   kendi hedefini ad duzeyinde de eliyordu. Tur katmaninda ayni hata
   vardi; ikisi birlikte duzeltildi.
*/
const YEME_ICME_AD = /restoran|restaurant|lokanta|kebap|pide|kahvalt|cafe|kafe|bistro|pastane|firin|bufe|dondurma/;
const KONAKLAMA_AD = /otel|hotel|pansiyon|konuk ?evi|\bapart\b|bungalov|bungalow|tatil koyu|\bkamp\b|konagi/;
const INSAAT_AD = /insaat|muteahhit|hafriyat|nakliyat|tadilat|yapi market|nalbur|hirdavat/;

NISLER.insaat.sektorDisiAdKaliplari = [
  YEME_ICME_AD,
  KONAKLAMA_AD,
  // "doseme" es sesli tuzagi: kilit tasi doseme <-> koltuk doseme.
  // "perde" tek basina ARANMAZ — "perde beton duvar" gercek bir insaat terimi.
  /koltuk doseme|mobilya doseme|oto doseme|perdeci|tul perde|stor perde|hali yikama/,
  /tesbih|kehribar|kuyumcu|\btaki\b|hediyelik/,
  /kuafor|guzellik salonu|\bberber\b|\bspa\b|\bmasaj\b/,
  /\bstudio\b|\bstudyo\b|fotograf|\bfoto\b/,
  /eczane|dis klinigi|dis hekim|agiz ve dis|veteriner/,
  /\bmarket\b|bakkal|\bmanav\b|\bkasap\b|sarkuteri/,
  /dershane|\bkurs\b/,
];

NISLER.turizm.sektorDisiAdKaliplari = [
  INSAAT_AD,
  /kuafor|guzellik salonu|\bberber\b/,
  /eczane|dis klinigi|dis hekim|veteriner/,
  /\bmarket\b|bakkal|\bmanav\b|\bkasap\b/,
  /oto servis|oto yikama|lastikci|galeri\b/,
];

/**
 * Tur bilgisi bos ya da yaniltici geldiginde ikinci savunma hatti.
 * Isletme ADINDA bu kaliplar geciyorsa insaat prospect'i degildir.
 */
import { trNormalize } from '@studio/data';

/**
 * Turkce ASCII normalizasyonu. Govde @studio/data'da — ayni ihtiyac
 * demo sablon secicisinde de cikinca (ve orada da ayni hatayla) tek bir
 * eve tasindi. Iki kopya olsaydi biri duzelirken digeri bozuk kalirdi.
 *
 * Neden gerekli: /inşaat/i.test("İNŞAAT") === false — JavaScript'in `i`
 * bayragi Turkce buyuk harflerde calismiyor. Maps adlarinin cogu tamamen
 * buyuk harf, yani normalizasyonsuz filtreler SESSIZCE calismiyor.
 */
export const adNormalize = trNormalize;

/**
 * Kaliplar adNormalize()'dan gecmis metne karsi calisir — yani hepsi
 * ASCII ve kucuk harf. `i` bayragina GEREK YOK ve kullanilmamali.
 */
/**
 * HERKES ICIN gecersiz adlar — hicbir niste musteri olamaz.
 *
 * Tur suzgecinin (`ASLA_PROSPECT`) ad tarafindaki ikizi. Ikisi ayri
 * katman olmak zorunda cunku Turkiye'ye ozgu kamu tesisleri Google'da
 * cogu zaman duz `establishment` olarak geliyor — tur etiketi yok, ad
 * her seyi soyluyor.
 */
export const EVRENSEL_AD_KALIPLARI = [
  /belediy|kaymakam|valilik|mudurlug|mudurluk|baskanlig|\bkurumu\b|sube mudur/,
  /ogretmenevi|ogretmen evi|misafirhane|sosyal tesis|dinlenme tesis/,
  /millet bahcesi|kultur parki|sehitlik|sehitleri|aniti\b|mesire|piknik alani/,
  /turbe|\bcami\b|camii|mescit|kilise|mezarlik|\bmuze\b|saat kulesi/,
  /tabiat park|milli park|kent orman|seyir teras|seyir tepe/,
  /kervansaray|oren yeri|antik kent|konak muze/,
  /\bgolu\b|\bgol\b|selale|magara|kanyon/,
  /hastane|poliklinik|devlet hastanesi/,
  /\bokulu\b|lisesi|universite|anaokul|\bkres\b/,
  /\btoki\b|kooperatifi? (blok|site)/,      // TOKI bloklari isletme degil
  /sitesi [a-z]?\d+ ?(blok|k\d)/,           // "X Sitesi B3 Blok"
];

/**
 * Geriye donuk uyum. Eskiden tek liste vardi; sektore ozgu kaliplar
 * artik `NISLER[...].sektorDisiAdKaliplari` icinde.
 */
export const IZINSIZ_AD_KALIPLARI = EVRENSEL_AD_KALIPLARI;

/*
   SEKTOR DISI AD KALIPLARI — nise gore, kurtarma YOK.

   `blokAdKaliplari`dan farki: orada sektor terimi geciyorsa kayit
   kurtariliyor ("<marka> GRUP INSAAT EMLAK" emlak yuzunden elenmez).
   Burada kurtarma yok — "YAPI RESTAURANT" adinda "yapi" gecse de
   lokantadir.

   Bunlarin evrensel listeden AYRILMASI sart oldu: eski surumde
   `otel|pansiyon|bungalov|konuk evi` genel kara listedeydi ve niş
   bağımsız uygulanıyordu, yani TURIZM taramasi kendi hedefini ad
   duzeyinde de eliyordu. Tur katmaninda ayni hata vardi; ikisi birlikte
   duzeltildi.
*/
/*
   Kaliplar YUKARIDA, `NISLER[...].sektorDisiAdKaliplari` atamasinin
   hemen ustunde tanimli — `const` bildirimleri yukari tasinmadigi icin
   burada tanimlamak "Cannot access before initialization" veriyordu.
*/

/** Site alaninda gercek bir site yerine sosyal medya profili olan hostlar. */
export const SOSYAL_HOSTLAR = [
  'instagram.com', 'facebook.com', 'fb.com', 'linkedin.com', 'twitter.com',
  'x.com', 'youtube.com', 'tiktok.com', 'sahibinden.com', 'hepsiemlak.com',
  'wa.me', 'api.whatsapp.com', 'linktr.ee', 'blogspot.com', 'wordpress.com',
];

/**
 * Sehir tanimlari. ilceler alani opsiyonel; verirsen sorgu sayisi artar ama
 * kapsam ciddi sekilde genisler (Maps merkez cevresine bias yapar).
 */
export const SEHIRLER = {
  'Düzce': { ilceler: ['Düzce merkez', 'Akçakoca', 'Gölyaka', 'Kaynaşlı', 'Cumayeri'] },
  'Bolu': { ilceler: ['Bolu merkez', 'Gerede', 'Mudurnu', 'Göynük'] },
  'Sakarya': { ilceler: ['Adapazarı', 'Serdivan', 'Hendek', 'Akyazı', 'Karasu'] },
  'Zonguldak': { ilceler: ['Zonguldak merkez', 'Çaycuma', 'Devrek', 'Alaplı'] },
  'Kocaeli': { ilceler: ['İzmit', 'Gebze', 'Darıca', 'Körfez', 'Gölcük'] },
  'Bursa': { ilceler: ['Nilüfer', 'Osmangazi', 'Yıldırım', 'İnegöl', 'Gemlik'] },
  'Eskişehir': { ilceler: ['Odunpazarı', 'Tepebaşı'] },
  'Ankara': { ilceler: ['Çankaya', 'Yenimahalle', 'Keçiören', 'Etimesgut', 'Sincan'] },
  'İstanbul': { ilceler: ['Kadıköy', 'Ümraniye', 'Beylikdüzü', 'Başakşehir', 'Pendik', 'Tuzla'] },
};

/**
 * Denetim bulgulari ve zayiflik puanlari. Puan yukseldikce site daha kotu,
 * yani prospect daha degerli. Bu agirliklari kendi tecrubene gore oynatabilirsin.
 */
export const BULGULAR = {
  // BASLIK BILEREK "site yok" DEMIYOR.
  //
  // Places API'nin bos donmesi "sitesi yok" demek degil, "Google bilmiyor"
  // demek. Bir tadilatcinin sitesi vardi (Google'in kendi business.site
  // hizmeti), Google 2024'te kapatti, adres artik 404 veriyor ve profilde
  // bagli site gorunmuyor. Baska bir prospect'in ise calisan bir sitesi
  // var ama profiline bagli degil.
  //
  // Sitesi olan birine "siteniz yok" demek raporun tamamini coper — adam
  // hakli olarak "bakmamis bile" diyor. Bu ifade her iki durumda da dogru
  // ve bagli olmamak zaten basli basina bir bulgu.
  site_yok: {
    puan: 100,
    baslik: 'Google profilinizde bağlı web sitesi yok',
    aciklama:
      'Google işletme kaydınız var ama profilinizde bağlı bir web sitesi görünmüyor. ' +
      'Haritalarda sizi bulan müşteri tek dokunuşla açabileceği bir sayfa göremiyor; ' +
      'siteniz olsa bile Google onu bu kayıtla ilişkilendirmediği için arama sonuçlarında ayrı düşüyor. ' +
      // Bu cumle, itiraz gelmeden ONCE cevabi veriyor. Bir tadilatcida
      // ogrendik: adam "kapanan sayfam yok" dedi ve business.google.com
      // adresindeki Google Isletme sayfasini gonderdi. Onu kendi sitesi
      // sayiyor ve bir bakima hakli — sayfa calisiyor. Fark, sahiplikte:
      // o sayfa Google'in, istedigi zaman bicimini degistirebiliyor
      // (business.site adreslerini bir kez zaten kapatti), hizmet sayfasi
      // acilamiyor, icerik yazilamiyor.
      'Google İşletme Profili sayfanız varsa o ayrı bir şey: çalışır ama Google’a aittir, ' +
      'yapısına siz karar veremezsiniz ve hizmet bazlı sayfa açamazsınız.',
  },
  sosyal_medya_site_yok: {
    puan: 95,
    baslik: 'Web siteniz yok, sosyal medya üzerinden ilerliyorsunuz',
    aciklama:
      'Google işletme kaydınızda web sitesi alanında bir sosyal medya profili görünüyor. Sosyal medya müşteriyle konuşmak için iyi çalışıyor; ancak Google arama sonuçlarında sizi sıralayamıyor. "Hizmet + şehir" aratan müşteri rakiplerinizi görüyor, sizi göremiyor. İşin fotoğrafları ve yorumlar zaten elinizde — eksik olan onları arama sonuçlarına taşıyan yapı.',
  },
  erisilemedi: { puan: 90, baslik: 'Siteye erişilemiyor', aciklama: 'Site adresi yanıt vermiyor veya çok yavaş. Müşteri açısından bu, sitenin hiç olmamasıyla aynı.' },
  eski_icerik: { puan: 22, baslik: 'Site güncelliğini yitirmiş', aciklama: 'Sitede birkaç yıl öncesine ait tarih bilgisi görünüyor. Hem ziyaretçide "bu firma hâlâ çalışıyor mu" sorusu doğuruyor hem Google güncelliği bir sıralama sinyali olarak kullanıyor.' },
  https_yok: { puan: 28, baslik: 'Güvenli bağlantı (HTTPS) yok', aciklama: 'Tarayıcılar siteyi "Güvenli değil" olarak işaretliyor. Bu hem ziyaretçiyi caydırıyor hem Google sıralamasında doğrudan dezavantaj.' },
  mobil_uyumsuz: { puan: 25, baslik: 'Mobil uyumlu değil', aciklama: 'Site telefonda düzgün ölçeklenmiyor. Bu sektörde aramaların büyük kısmı telefondan geliyor.' },
  psi_yavas: { puan: 22, baslik: 'Mobilde çok yavaş', aciklama: 'Google ölçümüne göre site telefonda yavaş açılıyor. Açılış 3 saniyeyi geçtiğinde ziyaretçilerin önemli bir kısmı beklemeden çıkıyor.' },
  psi_orta: { puan: 10, baslik: 'Mobil hız iyileştirilebilir', aciklama: 'Site açılıyor ama Google ölçümünde ortalama altı kalıyor. Hız hem sıralama hem dönüşüm etkiliyor.' },
  agir_sayfa: { puan: 12, baslik: 'Sayfa gereğinden ağır', aciklama: 'Sayfa boyutu optimize edilmemiş. Mobil veride yavaş yükleniyor ve gereksiz veri harcatıyor.' },
  baslik_yok: { puan: 18, baslik: 'Sayfa başlığı (title) tanımsız', aciklama: 'Google arama sonucunda gösterdiği başlık burasıdır. Boş olması, en temel SEO ayarının hiç yapılmadığını gösteriyor.' },
  baslik_kotu: { puan: 9, baslik: 'Sayfa başlığı zayıf', aciklama: 'Başlık ya çok kısa ya çok uzun ve içinde hizmet + şehir bilgisi geçmiyor. Arama sonucunda tıklanma oranını doğrudan etkiliyor.' },
  aciklama_yok: { puan: 11, baslik: 'Meta açıklama yok', aciklama: 'Arama sonucunda başlığın altında görünen tanıtım metni tanımlı değil. Google rastgele bir cümle çekiyor.' },
  h1_yok: { puan: 9, baslik: 'Ana başlık (H1) yok', aciklama: 'Sayfanın ne hakkında olduğunu belirten yapısal başlık eksik. Google konuyu anlamak için bu sinyali kullanıyor.' },
  schema_yok: { puan: 14, baslik: 'Yapısal veri (schema) yok', aciklama: 'Adres, telefon, çalışma saati, hizmet bilgileri Google\'ın okuyabileceği formatta işaretlenmemiş. Yerel aramalarda ve haritada görünürlüğü doğrudan etkiliyor.' },
  telefon_yok: { puan: 12, baslik: 'Tıklanabilir telefon yok', aciklama: 'Telefonda siteyi açan müşteri, numaraya dokunup arayamıyor. Yerel işlerde en kritik dönüşüm adımı bu.' },
  whatsapp_yok: { puan: 7, baslik: 'WhatsApp bağlantısı yok', aciklama: 'Bu sektörde müşterinin ilk teması ağırlıklı WhatsApp üzerinden oluyor; sitede tek dokunuşluk bir giriş yok.' },
  harita_yok: { puan: 7, baslik: 'Konum / harita bağlantısı yok', aciklama: 'Sitede Google Haritalar bağlantısı yok. Hem müşteri yol tarifi alamıyor hem işletme kaydınızla site arasındaki bağ zayıf kalıyor.' },
  sablon_platform: { puan: 10, baslik: 'Hazır şablon platformu', aciklama: 'Site hazır bir site kurucu üzerinde duruyor. Teknik SEO tarafında müdahale edilebilecek alan sınırlı, sayfa hızı ve özelleştirme tavanı düşük.' },
  tek_dil: { puan: 18, baslik: 'Yalnızca tek dilde', aciklama: 'Yurt dışına satış yapan bir firma için site tek dilde. Yabancı alıcı sizi kendi dilinde aradığında hiçbir sonuçta görünmüyorsunuz.' },
  gbp_zayif: { puan: 12, baslik: 'Google işletme kaydı zayıf', aciklama: 'İşletme profilinizde yorum sayısı düşük. Harita sonuçlarında sıralama büyük ölçüde bu sinyale bağlı.' },

  /*
     ─────────────────────────────────────────────────────────────────
     SITESI OLMAYAN ISLETME ICIN BULGULAR

     Denetimin tamami sitenin UZERINDE calisiyordu: baslik, h1, sema,
     mobil uyum, hiz. Sitesi olmayanda bakilacak sayfa yok, geriye tek
     bir `site_yok` kaliyordu.

     Uretilen 310 raporun 279'u bir ya da iki madde tasiyordu — yani
     asil hedef kitlede rapor en zayif halindeydi. Asagidaki uc bulgu
     Google kaydindan geliyor ve site olmadan da calisiyor.

     Denenip ELENEN bir dorduncu: fotograf sayisi. Sitesiz 402
     isletmenin ortalamasi 7,8 fotograf, ucten azi olan yalnizca 3
     tane. Herkesin yeterli fotografi varken "fotografiniz az" demek
     bos bir madde uretirdi.
     ─────────────────────────────────────────────────────────────────
  */

  alan_adi_baskasinda: {
    puan: 16,
    baslik: 'Adınızın alan adı başkasında',
    aciklama:
      'İşletmenizin adından türeyen alan adı kayıtlı ama size ait değil. Sizi arayan biri o adrese düştüğünde başka bir yere gidiyor. Kalan seçenekler de zamanla azalıyor — alan adı alınmadan önce belirlenmesi gereken bir şey.',
  },

  yorum_eskimis: {
    puan: 10,
    baslik: 'Son yorum epey eski',
    aciklama:
      'Google işletme kaydınıza uzun süredir yeni yorum gelmemiş. Harita sıralamasında yorum sayısı kadar tazeliği de sayılıyor; uzun sessizlik işletmeyi geri plana atıyor.',
  },

  yorum_rakipten_az: {
    puan: 9,
    baslik: 'Yorum sayısı emsalinin altında',
    aciklama:
      'Aynı bölgede aynı işi yapan işletmelerin ortancasına göre yorum sayınız düşük. Harita sonuçlarında yan yana çıktığınızda karşılaştırılan ilk sayı bu oluyor.',
  },
};

/** Firsat skoru = canlilik kapisi x zayiflik. Olu isletmenin kotu sitesi degersizdir. */
export const SKOR = {
  canlilikTabani: 0.4, // canlilik 0 olsa bile zayifligin %40'i sayilir

  /**
   * Bu yorum sayisindan sonra ek canlilik puani verilmez.
   *
   * 60'tan 25'e cekildi. Sebep: B2B insaat isletmelerinde 25 yorum zaten cok
   * iyi bir sayi. 60'ta tutunca yuzlerce yorumu olan tuketiciye donuk isletmeler
   * (lokanta, turistik yer) canlilik skorunu tavana vurup gercek muteahhitleri
   * listeden asagi itiyordu.
   */
  yorumDoygunluk: 25,
};
