import { DILLER, type Dil } from '@studio/data';

/**
 * Yerellestirilmis URL segmentleri.
 *
 * Neden onemli: /en/services/... , /en/hizmetler/... 'dan olculebilir sekilde
 * daha iyi siralaniyor. Ingilizce arayan kullanici URL'de Turkce segment
 * gordugunde de tiklama orani dusuyor.
 *
 * Arapca ve Rusca icin latin harf cevirisi kullaniyoruz — kiril/arap alfabesi
 * URL'de percent-encoding'e donusuyor ve paylasilan linkler okunmaz hale geliyor.
 */
export const SEGMENTLER = {
  hizmetler: { tr: 'hizmetler', en: 'services', de: 'leistungen', ar: 'khidmat', ru: 'uslugi', fr: 'services', es: 'servicios' },
  bolgeler: { tr: 'bolgeler', en: 'areas', de: 'gebiete', ar: 'mantiqa', ru: 'raiony', fr: 'zones', es: 'zonas' },
  hakkinda: { tr: 'hakkinda', en: 'about', de: 'ueber-uns', ar: 'hawlana', ru: 'o-nas', fr: 'a-propos', es: 'sobre-nosotros' },
  iletisim: { tr: 'iletisim', en: 'contact', de: 'kontakt', ar: 'ittisal', ru: 'kontakty', fr: 'contact', es: 'contacto' },
  galeri: { tr: 'galeri', en: 'gallery', de: 'galerie', ar: 'maarad', ru: 'galereya', fr: 'galerie', es: 'galeria' },
  sss: { tr: 'sss', en: 'faq', de: 'faq', ar: 'asila', ru: 'voprosy', fr: 'faq', es: 'preguntas' },
  menu: { tr: 'menu', en: 'menu', de: 'speisekarte', ar: 'qaima', ru: 'menyu', fr: 'menu', es: 'carta' },
  blog: { tr: 'blog', en: 'blog', de: 'blog', ar: 'mudawana', ru: 'blog', fr: 'blog', es: 'blog' },
} as const satisfies Record<string, Record<Dil, string>>;

export type SegmentAnahtari = keyof typeof SEGMENTLER;

export type SayfaTuru =
  | { tur: 'anasayfa' }
  | { tur: 'hizmet'; slug: string }
  | { tur: 'bolge'; slug: string }
  | { tur: 'sabit'; segment: Exclude<SegmentAnahtari, 'hizmetler' | 'bolgeler'> }
  | { tur: 'blogYazisi'; slug: string };

export type RotaBaglami = {
  /** Alan adi, protokol olmadan: "ornekfirma.com" */
  alanAdi: string;
  varsayilanDil: Dil;
  destekliDiller: readonly Dil[];
};

const segment = (anahtar: SegmentAnahtari, dil: Dil): string => SEGMENTLER[anahtar][dil];

/**
 * Sayfanin dile gore yol kismini uretir (alan adi olmadan).
 * Varsayilan dil prefix ALMAZ — "/" ; diger diller alir — "/en".
 */
export function yol(sayfa: SayfaTuru, dil: Dil, baglam: RotaBaglami): string {
  const onEk = dil === baglam.varsayilanDil ? '' : `/${dil}`;

  switch (sayfa.tur) {
    case 'anasayfa':
      return onEk || '/';
    case 'hizmet':
      return `${onEk}/${segment('hizmetler', dil)}/${sayfa.slug}`;
    case 'bolge':
      return `${onEk}/${segment('bolgeler', dil)}/${sayfa.slug}`;
    case 'blogYazisi':
      return `${onEk}/${segment('blog', dil)}/${sayfa.slug}`;
    case 'sabit':
      return `${onEk}/${segment(sayfa.segment, dil)}`;
  }
}

/** Tam kanonik URL. */
export function kanonik(sayfa: SayfaTuru, dil: Dil, baglam: RotaBaglami): string {
  return `https://${baglam.alanAdi}${yol(sayfa, dil, baglam)}`;
}

/**
 * hreflang haritasi. Next.js `alternates.languages` alanina dogrudan verilir.
 *
 * x-default zorunlu degil ama olmadiginda Google hangi surumu dil belirsiz
 * kullaniciya gosterecegini kendi tahmin ediyor. Varsayilan dili isaretliyoruz.
 */
export function dilAlternatifleri(
  sayfa: SayfaTuru,
  baglam: RotaBaglami,
  /**
   * Bu SAYFANIN var oldugu diller. Verilmezse sitenin destekledigi
   * butun diller varsayiliyor.
   *
   * Sitenin dil desteklemesi, HER SAYFANIN o dilde yayinlandigi anlamina
   * gelmiyor. Ingilizcesi henuz yazilmamis bir sayfaya `hreflang="en"`
   * koymak, arama motorunu var olmayan bir adrese yonlendiriyor.
   */
  diller: readonly Dil[] = baglam.destekliDiller,
): Record<string, string> {
  const harita: Record<string, string> = {};

  for (const dil of diller) {
    harita[dil] = kanonik(sayfa, dil, baglam);
  }
  // x-default her zaman varsayilan dile isaret ediyor — o sayfa
  // listede yoksa bile site bir yere dusmeli.
  harita['x-default'] = kanonik(sayfa, baglam.varsayilanDil, baglam);

  return harita;
}

/** Bir dil kodunun desteklenip desteklenmedigini calisma aninda kontrol eder. */
export function dilMi(deger: string): deger is Dil {
  return (DILLER as readonly string[]).includes(deger);
}
