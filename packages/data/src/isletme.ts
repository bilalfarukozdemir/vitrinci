import { z } from 'zod';
import { dilSemasi, yerelli } from './yerel.ts';

const slug = z
  .string()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug küçük harf, rakam ve tire içerebilir (ör. "kilit-tasi-doseme")');

const url = z.string().url();
const yerelliMetin = yerelli(z.string().min(1));

// ---------------------------------------------------------------- alt yapilar

export const medyaSemasi = z.object({
  url: z.string().min(1),
  alt: yerelliMetin,
  tur: z.enum(['gorsel', 'video']).default('gorsel'),
  genislik: z.number().int().positive().optional(),
  yukseklik: z.number().int().positive().optional(),
  /** Blok icinde one cikarilacak mi — galeri siralamasinda kullanilir. */
  oneCikan: z.boolean().optional(),
});

export const adresSemasi = z.object({
  baslik: z.string().optional(),
  sokak: z.string().optional(),
  ilce: z.string().optional(),
  il: z.string().min(1),
  postaKodu: z.string().optional(),
  ulke: z.string().default('TR'),
  enlem: z.number().min(-90).max(90).optional(),
  boylam: z.number().min(-180).max(180).optional(),
  mapsUrl: url.optional(),
  /** Musterinin gelebilecegi fiziksel bir yer mi, yoksa sadece kayit adresi mi? */
  ziyaretEdilebilir: z.boolean().default(true),
});

/**
 * Hizmet verilen bolgeler. Yerel SEO'nun en cok is yapan alani:
 * "Duzce kilit tasi", "Akcakoca peyzaj" gibi sayfalar buradan uretiliyor.
 */
export const bolgeSemasi = z.object({
  ad: z.string().min(1),
  tur: z.enum(['ulke', 'il', 'ilce', 'mahalle']),
  il: z.string().optional(),
  ulke: z.string().default('TR'),
  /** Kendi acilis sayfasi olusturulsun mu? Her bolge icin sayfa acmak dogru degil. */
  sayfaAc: z.boolean().default(false),
});

/**
 * Tekrar eden odeme — WaaS/abonelik modeli.
 *
 * NEDEN AYRI BIR ALAN: `min`/`max` tek seferlik bir aralik anlatiyor.
 * Ayni hizmet hem "18.000 TL'den baslayan proje" hem "4.000 kurulum +
 * aylik 950" olarak satiliyorsa bu IKI FARKLI TEKLIF, tek fiyatin iki
 * ucu degil. Tek alana sikistirilirsa yapisal veride yalnizca biri
 * gorunur — ve pratikte gorunen, buyuk olan oluyor.
 *
 * `kurulum` bilerek burada: aylik fiyat tek basina yaziinca musteri
 * ilk ay ne odeyecegini bilmiyor. Isaretlemede ikisi tek teklifin iki
 * bileseni olarak duruyor.
 */
export const abonelikSemasi = z.object({
  tutar: z.number().nonnegative(),
  /** UN/CEFACT birim kodu uretiliyor: ay → MON, yil → ANN. */
  periyot: z.enum(['ay', 'yil']).default('ay'),
  /** Bir kerelik kurulum bedeli. Yoksa alan basilmiyor. */
  kurulum: z.number().nonnegative().optional(),
});

export const fiyatSemasi = z.object({
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
  birim: z.string().optional(), // "m²", "adet", "proje"
  paraBirimi: z.string().default('TRY'),
  /** Tekrar eden odeme secenegi. Tek seferlige EK, onun yerine degil. */
  abonelik: abonelikSemasi.optional(),
  /** "Ücretsiz keşif, sabit fiyat" gibi fiyat yerine gecen mesaj. */
  not: yerelliMetin.optional(),
});

export const hizmetSemasi = z.object({
  slug,
  ad: yerelliMetin,
  ozet: yerelliMetin,
  aciklama: yerelliMetin.optional(),
  gorseller: z.array(medyaSemasi).default([]),
  fiyat: fiyatSemasi.optional(),
  /**
   * Bu hizmetin hedefledigi arama terimleri. SEO paketi metadata ve
   * ic linkleme onerilerini buradan uretiyor — elle title yazmak yok.
   */
  anahtarKelimeler: z.array(z.string().min(2)).default([]),
  oneCikan: z.boolean().default(false),
});

export const referansSemasi = z.object({
  yazar: z.string().min(1),
  unvan: z.string().optional(),
  firma: z.string().optional(),
  metin: yerelliMetin,
  puan: z.number().min(1).max(5).optional(),
  tarih: z.string().optional(),
  kaynak: z.enum(['google', 'musteri', 'elle']).default('elle'),
  kaynakUrl: url.optional(),
});

export const sssSemasi = z.object({
  soru: yerelliMetin,
  cevap: yerelliMetin,
});

export const calismaSaatiSemasi = z.object({
  /** 0 = Pazar ... 6 = Cumartesi (JS Date.getDay ile ayni) */
  gun: z.number().int().min(0).max(6),
  acilis: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  kapanis: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  kapali: z.boolean().default(false),
});

/**
 * Marka token'lari. Bloklar renk/font HARDCODE ETMEZ, buradan okur.
 * Bu sinir, "her site birbirinden farkli" satis argumanini koruyan sey —
 * ortak kutuphane ama site basina tema.
 */
export const markaSemasi = z.object({
  logo: medyaSemasi.optional(),
  logoKoyu: medyaSemasi.optional(),
  favicon: z.string().optional(),
  renkler: z.object({
    ana: z.string().min(3),
    vurgu: z.string().optional(),
    arkaplan: z.string().optional(),
    yuzey: z.string().optional(),
    metin: z.string().optional(),
    soluk: z.string().optional(),
  }),
  yaziTipi: z
    .object({
      baslik: z.string().optional(),
      govde: z.string().optional(),
    })
    .optional(),
  kose: z.enum(['keskin', 'yumusak', 'yuvarlak']).default('yumusak'),
  /** Kopyanin ve gorsel dilin tonu — blok secimini ve bosluk ritmini etkiler. */
  ton: z.enum(['kurumsal', 'sicak', 'premium', 'teknik', 'canli']).default('kurumsal'),
});

export const iletisimSemasi = z.object({
  telefon: z.string().optional(),
  ikinciTelefon: z.string().optional(),
  whatsapp: z.string().optional(),
  eposta: z.string().email().optional(),
  /** Iletisim formu gonderimlerinin gidecegi adres. */
  formHedefi: z.string().email().optional(),
});

export const sosyalSemasi = z.object({
  instagram: url.optional(),
  facebook: url.optional(),
  linkedin: url.optional(),
  youtube: url.optional(),
  x: url.optional(),
  tiktok: url.optional(),
  /**
   * GitHub profili.
   *
   * Diger alanlar pazarlama kanali; bu KANIT. Yazilim isi satan biri icin
   * "bu cerceveyi ben yazdim" cumlesini tiklanabilir hale getiriyor —
   * teknik bir alici icin referans metninden guclu.
   *
   * `sameAs` icine giriyor ve Google'in varlik eslestirmesini besliyor:
   * ayni kisinin GitHub, site ve isletme kaydi arasindaki bagi kuruyor.
   * Yeni bir alan adinin en buyuk sorunu "bu kim" ve bu, cevabin bir
   * parcasi.
   */
  github: url.optional(),
});

export const seoSemasi = z.object({
  alanAdi: z.string().optional(),
  gbpUrl: url.optional(),
  gbpPlaceId: z.string().optional(),
  /** Demo asamasinda arama motorlarina kapali tutulur. */
  indekslenebilir: z.boolean().default(false),

  /**
   * Ikinci dil surumu Google'a acik mi.
   *
   * `indekslenebilir`den AYRI bir anahtar, cunku iki farkli soruyu
   * yanitliyorlar: birincisi "bu site canli mi", ikincisi "ikinci dilin
   * metni hazir mi". Turkce surum aylardir indekslenirken Ingilizce
   * metin taslak halinde durabilir.
   *
   * Kapaliyken iki sey birden oluyor: ikinci dil sitemap'e girmiyor ve
   * sayfalari `noindex` aliyor. Ikisi tek anahtardan donmeli — biri
   * acik biri kapali kalirsa sitemap Google'a "sunu tara" derken sayfa
   * "beni indeksleme" diyor, ki bu Search Console'da dogrudan hata.
   *
   * Yarim cevrilmis bir sayfanin indekslenmesi, hic olmamasindan kotu:
   * Google yanlis dilde bir sayfa gorup siteyi yanlis kitleye gosterir.
   */
  ingilizceYayinda: z.boolean().default(false),
  gaOlcumId: z.string().optional(),
  gscDogrulama: z.string().optional(),

  /**
   * Sabit sayfalarin meta aciklamalarini ELLE ezmek icin.
   *
   * Bos birakilabilir ve cogu zaman birakilmali: @studio/seo bu sayfalar
   * icin aciklamayi sayfanin KENDI iceriginden turetiyor (SSS'te ilk
   * sorular, iletisimde adres, hakkindada uzun aciklama). Burasi o
   * varsayilanin yetmedigi tek tuk durum icin.
   *
   * Neden onemli: bu isaretlemenin buyuk kismi OTOMATIK URETILEN demolara
   * gidiyor, kimse elle aciklama yazmiyor. Elle yazmayi zorunlu kilan bir
   * cozum, pratikte hic uygulanmayan bir cozum olurdu.
   */
  sayfaAciklamalari: z
    .object({
      hakkinda: yerelliMetin.optional(),
      iletisim: yerelliMetin.optional(),
      galeri: yerelliMetin.optional(),
      sss: yerelliMetin.optional(),
      blog: yerelliMetin.optional(),
      arastirma: yerelliMetin.optional(),
    })
    .optional(),
});

/**
 * Verinin nereden geldigi. Demo → gercek site gecisinde kritik:
 * Maps'ten gelen veri musteri onaylamadan yayina alinmaz.
 */
export const kaynakSemasi = z.object({
  tur: z.enum(['maps', 'elle', 'musteri']),
  mapsPlaceId: z.string().optional(),
  taranmaTarihi: z.string().optional(),
  musteriOnayli: z.boolean().default(false),
});

// ---------------------------------------------------------------- kok sema

const alanlar = {
  slug,
  ad: z.string().min(1),
  yasalAd: z.string().optional(),
  kurulusYili: z.number().int().min(1800).max(2100).optional(),
  sektor: z.string().optional(),

  /**
   * Google'in isletmeye verdigi tur etiketleri ("furniture_store", "landscaper").
   *
   * Neden sema seviyesinde: isletmenin NE OLDUGUNU soyleyen en guvenilir sinyal
   * bu. Bulundugu arama terimi degil — "bahce duzenleme" aramasinda cikan bir
   * isletme bahce MOBILYASI magazasi olabiliyor.
   */
  googleTurleri: z.array(z.string()).default([]),

  ozet: yerelliMetin.optional(),
  uzunAciklama: yerelliMetin.optional(),
  slogan: yerelliMetin.optional(),

  marka: markaSemasi.partial({ renkler: true }).optional(),
  iletisim: iletisimSemasi.default({}),
  adresler: z.array(adresSemasi).default([]),
  hizmetVerilenBolgeler: z.array(bolgeSemasi).default([]),
  hizmetler: z.array(hizmetSemasi).default([]),
  galeri: z.array(medyaSemasi).default([]),
  referanslar: z.array(referansSemasi).default([]),
  sss: z.array(sssSemasi).default([]),
  calismaSaatleri: z.array(calismaSaatiSemasi).default([]),
  sosyal: sosyalSemasi.default({}),

  diller: z
    .object({
      varsayilan: dilSemasi.default('tr'),
      destekli: z.array(dilSemasi).min(1).default(['tr']),
    })
    .default({ varsayilan: 'tr', destekli: ['tr'] }),

  seo: seoSemasi.default({}),
  kaynak: kaynakSemasi.default({ tur: 'elle', musteriOnayli: false }),

  /** Google isletme kaydindan gelen sinyaller — vaka calismasi ve teklif icin. */
  gbpMetrikleri: z
    .object({
      puan: z.number().min(0).max(5).optional(),
      yorumSayisi: z.number().int().nonnegative().optional(),
    })
    .optional(),
};

/**
 * Taslak isletme — demo asamasi. Maps taramasindan cikan kismi veri bu semayi gecer.
 * Zorunlu olan tek sey: slug ve ad.
 */
export const isletmeTaslakSemasi = z.object(alanlar);

/**
 * Tam isletme — yayina alinabilir site. Taslakla AYNI sema, sadece
 * production icin gerekli alanlar zorunlu. Ayri bir tip yok, ayri kod yok:
 * demo ile gercek site ayni artifact.
 */
export const isletmeSemasi = isletmeTaslakSemasi
  .extend({
    ozet: yerelliMetin,
    sektor: z.string().min(2),
    marka: markaSemasi,
    hizmetler: z.array(hizmetSemasi).min(1, 'En az bir hizmet tanımlanmalı'),
    // NOT: galeri BILEREK zorunlu degil.
    //
    // Onceki surum en az bir gorsel sart kosuyordu ve metin agirlikli bir
    // danismanlik sitesini yayina almayi engelledi. Sema, sitenin CALISMASI
    // icin gerekli olani zorunlu tutmali; "olsa iyi olur"u degil.
    // Gorsel eksikligi `yayinaHazirMi()` icinde uyari olarak duruyor.
  })
  .refine((i) => Boolean(i.iletisim.telefon || i.iletisim.whatsapp), {
    message: 'Telefon veya WhatsApp numarası zorunlu — dönüşümün tek yolu',
    path: ['iletisim'],
  })
  .refine((i) => i.adresler.length > 0 || i.hizmetVerilenBolgeler.length > 0, {
    message: 'En az bir adres veya hizmet bölgesi gerekli (yerel SEO için)',
    path: ['adresler'],
  })
  .refine((i) => Boolean(i.seo.alanAdi), {
    message: 'Yayına almak için alan adı gerekli',
    path: ['seo', 'alanAdi'],
  });

export type IsletmeTaslak = z.infer<typeof isletmeTaslakSemasi>;
export type Isletme = z.infer<typeof isletmeSemasi>;
export type Medya = z.infer<typeof medyaSemasi>;
export type Hizmet = z.infer<typeof hizmetSemasi>;
export type Bolge = z.infer<typeof bolgeSemasi>;
export type Adres = z.infer<typeof adresSemasi>;
export type Referans = z.infer<typeof referansSemasi>;
export type Sss = z.infer<typeof sssSemasi>;
export type Marka = z.infer<typeof markaSemasi>;

// ---------------------------------------------------------------- yardimcilar

export type EksikAlan = { alan: string; aciklama: string };

/**
 * Taslak bir isletmenin yayina alinmak icin nesi eksik oldugunu insan diliyle listeler.
 * Demo → gercek site gecisinde musteriden ne toplayacaginin kontrol listesi;
 * bu ciktiyi dogrudan musteriye gonderebilirsin.
 */
export function yayinaHazirMi(taslak: IsletmeTaslak): { hazir: boolean; eksikler: EksikAlan[] } {
  const eksikler: EksikAlan[] = [];
  const ekle = (alan: string, aciklama: string) => eksikler.push({ alan, aciklama });

  if (!taslak.ozet) ekle('ozet', 'İşletmeyi bir paragrafta anlatan özet metin');
  if (!taslak.sektor) ekle('sektor', 'Sektör (şema işaretlemesi ve blok seçimi için)');
  if (!taslak.marka?.renkler?.ana) ekle('marka.renkler.ana', 'Marka ana rengi');
  if (!taslak.marka?.logo) ekle('marka.logo', 'Logo dosyası (tercihen SVG veya şeffaf PNG)');
  if (!taslak.hizmetler.length) ekle('hizmetler', 'En az bir hizmet — adı, özeti ve hedef arama terimleri');
  if (!taslak.galeri.length) ekle('galeri', 'Gerçek iş fotoğrafları — stok görsel dönüşümü düşürüyor');
  if (!taslak.iletisim.telefon && !taslak.iletisim.whatsapp) {
    ekle('iletisim', 'Telefon veya WhatsApp numarası');
  }
  if (!taslak.adresler.length && !taslak.hizmetVerilenBolgeler.length) {
    ekle('adresler', 'Adres veya hizmet verilen bölgeler (yerel SEO için)');
  }
  if (!taslak.seo.alanAdi) {
    ekle('seo.alanAdi', 'Alan adı — mevcut bir alan adınız varsa erişim, yoksa satın alınacak');
  }
  if (!taslak.referanslar.length) {
    ekle('referanslar', 'Müşteri yorumları — Google yorumlarından da aktarılabilir');
  }
  if (!taslak.sss.length) ekle('sss', 'Sık sorulan sorular (SSS şeması arama sonuçlarında yer kaplıyor)');
  if (!taslak.kaynak.musteriOnayli) {
    ekle('kaynak.musteriOnayli', 'Maps\'ten çekilen bilgilerin müşteri tarafından doğrulanması');
  }

  return { hazir: eksikler.length === 0, eksikler };
}

/** Taslagi tam semaya karsi dogrular. Basarisizsa okunabilir hata listesi verir. */
export function tamOlarakDogrula(veri: unknown):
  | { basarili: true; isletme: Isletme }
  | { basarili: false; hatalar: string[] } {
  const sonuc = isletmeSemasi.safeParse(veri);
  if (sonuc.success) return { basarili: true, isletme: sonuc.data };

  return {
    basarili: false,
    hatalar: sonuc.error.issues.map((h) => `${h.path.join('.') || '(kök)'}: ${h.message}`),
  };
}
