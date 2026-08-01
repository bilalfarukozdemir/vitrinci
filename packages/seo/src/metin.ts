import { coz, type Dil, type Isletme, type IsletmeTaslak, type Hizmet, type Yerelli } from '@studio/data';

/**
 * Denetim motorunun (tools/prospect) baslik/aciklama icin kullandigi esiklerle
 * AYNI degerler. Ureticinin, yargicin olcutunu gecmesi gerekiyor —
 * kendi urettigimiz baslik kendi denetimimizden dusuk puan almamali.
 */
export const ESIKLER = {
  baslikEnAz: 20,
  baslikEnFazla: 65,
  aciklamaEnAz: 40,
  aciklamaHedef: 155,
  aciklamaEnFazla: 160,
} as const;

/** Yerelli degeri coz; yoksa yedege dus. */
export function metin(
  deger: Yerelli<string> | undefined,
  dil: Dil,
  varsayilan: Dil,
  yedek = '',
): string {
  return coz(deger, dil, varsayilan) ?? yedek;
}

/**
 * Kelime sinirinda kirpar. Ortada kesilmis kelime hem arama sonucunda
 * hem paylasim kartinda kotu gorunuyor.
 */
export function kirp(kaynak: string, enFazla: number): string {
  const temiz = kaynak.replace(/\s+/g, ' ').trim();
  if (temiz.length <= enFazla) return temiz;

  const kesilmis = temiz.slice(0, enFazla - 1);
  const bosluk = kesilmis.lastIndexOf(' ');
  return `${(bosluk > enFazla * 0.6 ? kesilmis.slice(0, bosluk) : kesilmis).replace(/[.,;:\-–—]$/, '')}…`;
}

/**
 * Parcalari verilen ayiracla birlestirir ama uzunluk sinirini asarsa
 * sondan parca atarak sigdirir. Boylece "marka + hizmet + sehir" ideal,
 * yer yoksa "marka + hizmet", en kotu "marka" cikiyor.
 */
export function sigdir(parcalar: (string | undefined)[], ayirac: string, enFazla: number): string {
  const dolu = parcalar.filter((p): p is string => Boolean(p?.trim())).map((p) => p.trim());
  if (!dolu.length) return '';

  for (let adet = dolu.length; adet > 1; adet--) {
    const aday = dolu.slice(0, adet).join(ayirac);
    if (aday.length <= enFazla) return aday;
  }

  return kirp(dolu[0] ?? '', enFazla);
}

/** One cikan hizmet, yoksa ilk hizmet. Baslik uretiminin omurgasi. */
export function anaHizmet(isletme: IsletmeTaslak): Hizmet | undefined {
  return isletme.hizmetler.find((h) => h.oneCikan) ?? isletme.hizmetler[0];
}

/** Baslikta kullanilacak sehir: once fiziksel adres, sonra hizmet bolgesi. */
export function anaSehir(isletme: IsletmeTaslak): string | undefined {
  return isletme.adresler[0]?.il ?? isletme.hizmetVerilenBolgeler[0]?.ad;
}

/** Isletmenin tam adi + tuzel bilgi varsa onu tercih etme — marka adi daha iyi tikliyor. */
export function markaAdi(isletme: IsletmeTaslak): string {
  return isletme.ad.trim();
}

const OG_YEREL: Record<Dil, string> = {
  tr: 'tr_TR',
  en: 'en_US',
  de: 'de_DE',
  ar: 'ar_SA',
  ru: 'ru_RU',
  fr: 'fr_FR',
  es: 'es_ES',
};

export const ogYereli = (dil: Dil): string => OG_YEREL[dil];

/** Sabit sayfa basliklari — her dil icin. */
export const SAYFA_ADLARI = {
  hakkinda: { tr: 'Hakkımızda', en: 'About Us', de: 'Über uns', ar: 'من نحن', ru: 'О нас', fr: 'À propos', es: 'Sobre nosotros' },
  iletisim: { tr: 'İletişim', en: 'Contact', de: 'Kontakt', ar: 'اتصل بنا', ru: 'Контакты', fr: 'Contact', es: 'Contacto' },
  galeri: { tr: 'Galeri', en: 'Gallery', de: 'Galerie', ar: 'معرض', ru: 'Галерея', fr: 'Galerie', es: 'Galería' },
  sss: { tr: 'Sık Sorulan Sorular', en: 'FAQ', de: 'Häufige Fragen', ar: 'الأسئلة الشائعة', ru: 'Вопросы и ответы', fr: 'Questions fréquentes', es: 'Preguntas frecuentes' },
  blog: { tr: 'Blog', en: 'Blog', de: 'Blog', ar: 'المدونة', ru: 'Блог', fr: 'Blog', es: 'Blog' },
} as const satisfies Record<string, Record<Dil, string>>;

/** "Düzce ve çevresinde hizmet veriyoruz" gibi bolge cumlesi. */
export function bolgeCumlesi(isletme: Isletme | IsletmeTaslak, dil: Dil): string {
  const bolgeler = isletme.hizmetVerilenBolgeler.map((b) => b.ad).filter(Boolean);
  const sehir = anaSehir(isletme);
  const liste = bolgeler.length ? bolgeler.slice(0, 3).join(', ') : sehir;
  if (!liste) return '';

  const kaliplar: Record<Dil, string> = {
    tr: `${liste} ve çevresinde hizmet veriyoruz.`,
    en: `Serving ${liste} and surrounding areas.`,
    de: `Wir bedienen ${liste} und Umgebung.`,
    ar: `نخدم ${liste} والمناطق المحيطة.`,
    ru: `Обслуживаем ${liste} и окрестности.`,
    fr: `Nous desservons ${liste} et ses environs.`,
    es: `Atendemos ${liste} y alrededores.`,
  };

  return kaliplar[dil];
}
