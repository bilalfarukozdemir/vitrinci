import type { Bolge, Dil, Hizmet, IsletmeTaslak } from '@studio/data';

import {
  ESIKLER,
  SAYFA_ADLARI,
  anaHizmet,
  anaSehir,
  bolgeCumlesi,
  kirp,
  markaAdi,
  metin,
  ogYereli,
  sigdir,
} from './metin.ts';
import { dilAlternatifleri, kanonik, type RotaBaglami, type SayfaTuru } from './rotalar.ts';

/**
 * Next.js `Metadata` tipiyle yapisal olarak uyumlu. Kasitli olarak next'e
 * bagimli DEGIL — Katman 1 uygulama cercevesini bilmemeli.
 */
export type SayfaMetadata = {
  title: string;
  description: string;
  keywords?: string[];
  /**
   * Goreli gorsel yollarinin (/og.png) mutlak URL'e cevrilecegi taban.
   * Verilmezse Next.js localhost varsayiyor ve paylasim kartlari kirik cikiyor.
   */
  metadataBase: URL;
  alternates: { canonical: string; languages: Record<string, string> };
  robots: { index: boolean; follow: boolean };
  openGraph: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    locale: string;
    type: 'website';
    images?: { url: string; alt: string }[];
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    images?: string[];
  };
};

const DEMO_ALAN_ADI = 'demo.local';

/** Isletmeden rota baglami cikarir. Demo asamasinda alan adi disaridan verilebilir. */
export function baglamOlustur(isletme: IsletmeTaslak, alanAdiEzme?: string): RotaBaglami {
  return {
    alanAdi: alanAdiEzme ?? isletme.seo.alanAdi ?? DEMO_ALAN_ADI,
    varsayilanDil: isletme.diller.varsayilan,
    destekliDiller: isletme.diller.destekli,
  };
}

/**
 * Baslik cok kisaysa sehir/sektor ekleyip guclendirir.
 *
 * Sebebi: kendi denetim motorumuz 20 karakterden kisa basligi "zayif" olarak
 * isaretliyor. Uretici, yargicin olcutunu gecmek zorunda.
 */
function baslikGuclendir(taban: string, isletme: IsletmeTaslak, dil: Dil): string {
  if (taban.length >= ESIKLER.baslikEnAz) return taban;

  const sehir = anaSehir(isletme);
  const sektor = isletme.sektor;

  for (const ek of [sehir, sektor]) {
    if (!ek) continue;
    const aday = `${taban} | ${ek}`;
    if (aday.length <= ESIKLER.baslikEnFazla) {
      if (aday.length >= ESIKLER.baslikEnAz) return aday;
      taban = aday;
    }
  }

  return taban;
}

function aciklamaHazirla(
  parcalar: (string | undefined)[],
  isletme: IsletmeTaslak,
  dil: Dil,
): string {
  let birlesik = parcalar.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

  // Cok kisa aciklama arama sonucunda Google'in rastgele cumle secmesine yol aciyor.
  if (birlesik.length < ESIKLER.aciklamaEnAz) {
    const ek = bolgeCumlesi(isletme, dil);
    if (ek) birlesik = `${birlesik} ${ek}`.trim();
  }

  return kirp(birlesik, ESIKLER.aciklamaHedef);
}

function govde(
  isletme: IsletmeTaslak,
  dil: Dil,
  sayfa: SayfaTuru,
  baslik: string,
  aciklama: string,
  anahtarKelimeler: string[],
  baglam: RotaBaglami,
): SayfaMetadata {
  const url = kanonik(sayfa, dil, baglam);
  const varsayilan = isletme.diller.varsayilan;

  const kapakGorseli = isletme.galeri.find((g) => g.oneCikan) ?? isletme.galeri[0];
  const gorseller = kapakGorseli
    ? [{ url: kapakGorseli.url, alt: metin(kapakGorseli.alt, dil, varsayilan, isletme.ad) }]
    : undefined;

  return {
    title: baslik,
    description: aciklama,
    keywords: anahtarKelimeler.length ? anahtarKelimeler : undefined,
    metadataBase: new URL(`https://${baglam.alanAdi}`),
    alternates: {
      canonical: url,
      languages: dilAlternatifleri(sayfa, baglam),
    },
    // Demo asamasinda seo.indekslenebilir = false. Dogrulanmamis musteri
    // verisi Google'a dusmuyor.
    robots: {
      index: isletme.seo.indekslenebilir,
      follow: isletme.seo.indekslenebilir,
    },
    openGraph: {
      title: baslik,
      description: aciklama,
      url,
      siteName: isletme.ad,
      locale: ogYereli(dil),
      type: 'website',
      images: gorseller,
    },
    twitter: {
      card: 'summary_large_image',
      title: baslik,
      description: aciklama,
      images: gorseller?.map((g) => g.url),
    },
  };
}

// ---------------------------------------------------------------- anasayfa

export function anasayfaMetadata(
  isletme: IsletmeTaslak,
  dil: Dil,
  alanAdiEzme?: string,
): SayfaMetadata {
  const varsayilan = isletme.diller.varsayilan;
  const baglam = baglamOlustur(isletme, alanAdiEzme);

  const hizmet = anaHizmet(isletme);
  const hizmetAdi = hizmet ? metin(hizmet.ad, dil, varsayilan) : isletme.sektor;
  const sehir = anaSehir(isletme);

  // Kalip: "Marka — Hizmet Sehir". Yer yetmezse sondan parca atiliyor.
  const baslik = baslikGuclendir(
    sigdir([markaAdi(isletme), [hizmetAdi, sehir].filter(Boolean).join(' ')], ' — ', ESIKLER.baslikEnFazla),
    isletme,
    dil,
  );

  const aciklama = aciklamaHazirla(
    [metin(isletme.ozet, dil, varsayilan), metin(isletme.slogan, dil, varsayilan)],
    isletme,
    dil,
  );

  const anahtarKelimeler = [
    ...new Set(isletme.hizmetler.flatMap((h) => h.anahtarKelimeler)),
  ].slice(0, 12);

  return govde(isletme, dil, { tur: 'anasayfa' }, baslik, aciklama, anahtarKelimeler, baglam);
}

// ---------------------------------------------------------------- hizmet sayfasi

export function hizmetMetadata(
  isletme: IsletmeTaslak,
  hizmet: Hizmet,
  dil: Dil,
  alanAdiEzme?: string,
): SayfaMetadata {
  const varsayilan = isletme.diller.varsayilan;
  const baglam = baglamOlustur(isletme, alanAdiEzme);

  const hizmetAdi = metin(hizmet.ad, dil, varsayilan, isletme.ad);
  const sehir = anaSehir(isletme);

  // Kalip: "Hizmet Sehir | Marka" — arama terimi basta, marka sonda.
  const baslik = baslikGuclendir(
    sigdir([[hizmetAdi, sehir].filter(Boolean).join(' '), markaAdi(isletme)], ' | ', ESIKLER.baslikEnFazla),
    isletme,
    dil,
  );

  const aciklama = aciklamaHazirla(
    [metin(hizmet.ozet, dil, varsayilan), metin(hizmet.aciklama, dil, varsayilan)],
    isletme,
    dil,
  );

  return govde(
    isletme,
    dil,
    { tur: 'hizmet', slug: hizmet.slug },
    baslik,
    aciklama,
    hizmet.anahtarKelimeler.slice(0, 12),
    baglam,
  );
}

// ---------------------------------------------------------------- bolge sayfasi

export function bolgeMetadata(
  isletme: IsletmeTaslak,
  bolge: Bolge,
  dil: Dil,
  alanAdiEzme?: string,
): SayfaMetadata {
  const varsayilan = isletme.diller.varsayilan;
  const baglam = baglamOlustur(isletme, alanAdiEzme);

  const hizmet = anaHizmet(isletme);
  const hizmetAdi = hizmet ? metin(hizmet.ad, dil, varsayilan) : isletme.sektor;

  const baslik = baslikGuclendir(
    sigdir([[hizmetAdi, bolge.ad].filter(Boolean).join(' '), markaAdi(isletme)], ' | ', ESIKLER.baslikEnFazla),
    isletme,
    dil,
  );

  const aciklama = aciklamaHazirla(
    [
      `${bolge.ad} ${hizmetAdi ?? ''}`.trim() + '.',
      metin(isletme.ozet, dil, varsayilan),
    ],
    isletme,
    dil,
  );

  const anahtarKelimeler = (hizmet?.anahtarKelimeler ?? [])
    .map((k) => `${k} ${bolge.ad}`)
    .slice(0, 8);

  return govde(
    isletme,
    dil,
    { tur: 'bolge', slug: bolgeSlugu(bolge) },
    baslik,
    aciklama,
    anahtarKelimeler,
    baglam,
  );
}

/** Bolge adindan slug. data paketindeki slugla() ile ayni kurallar. */
export function bolgeSlugu(bolge: Bolge): string {
  return bolge.ad
    .replace(/[çÇğĞıIİiöÖşŞüÜ]/g, (h) => ({ ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i', i: 'i', ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u' })[h] ?? h)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------- sabit sayfalar

/**
 * Sabit sayfanin KENDI icerigin­den aciklama uretir.
 *
 * BUNUN SEBEBI SOMUT: onceki hal her sabit sayfaya "<Sayfa adi> —
 * <Isletme>." + isletmenin genel ozetini yaziyordu. Sonuc olarak /sss,
 * /hakkinda ve /iletisim'in aciklamasi ilk iki kelime disinda BIREBIR
 * ayniydi — ustelik anasayfanin aciklamasi da ayni cumleydi. Yeni bir
 * sitede birbirine benzeyen sayfalar "Tarandi – su anda dizine
 * eklenmedi" durumunun bilinen sebeplerinden biri.
 *
 * Her sayfa icin o sayfada GERCEKTEN duran malzeme kullaniliyor:
 * SSS'te sorular, iletisimde adres, hakkindada uzun aciklama, galeride
 * fotograf sayisi. Boylece elle hicbir sey yazilmadan aciklamalar
 * birbirinden ayrisiyor — otomatik uretilen demolar icin tek uygulanabilir
 * cozum bu.
 *
 * Malzeme yoksa (orn. SSS'i olmayan bir isletme) eski davranisa dusuyor;
 * bos aciklamadan jenerik aciklama iyidir.
 */
function sabitSayfaMalzemesi(
  isletme: IsletmeTaslak,
  sayfaAnahtari: keyof typeof SAYFA_ADLARI,
  dil: Dil,
): string | undefined {
  const varsayilan = isletme.diller.varsayilan;
  const cevir = (d: Parameters<typeof metin>[0]) => metin(d, dil, varsayilan);

  switch (sayfaAnahtari) {
    case 'hakkinda':
      // Bos dizge undefined'a cevriliyor ki cagiran taraftaki || zinciri calissin.
      return cevir(isletme.uzunAciklama) || undefined;

    case 'sss': {
      // Ilk sorular hem sayfaya ozgu hem de aranan seye benziyor —
      // insanlar Google'a soruyu oldugu gibi yaziyor.
      const sorular = isletme.sss.map((s) => cevir(s.soru)).filter(Boolean).slice(0, 3);
      return sorular.length ? sorular.join(' ') : undefined;
    }

    case 'iletisim': {
      /*
         "Adres" kelimesi ancak GERCEKTEN adres varsa geciyor.

         Onceki hal adresi olmayan isletmede de "adres, telefon ve
         calisma saatleri" diyordu — sayfada adres yokken arama
         sonucunda adres vaat etmek, tiklayani bos bir sayfaya
         gonderiyor. Ofissiz calisanlarda (bu deponun kullanicilarinin
         cogu) yanlis olan varsayilan buydu.
      */
      const adres = isletme.adresler[0];
      const acikAdres = [adres?.ilce, adres?.il].filter(Boolean).join(', ');
      if (acikAdres) return `${acikAdres} — adres, telefon ve çalışma saatleri.`;

      const bolgeler = isletme.hizmetVerilenBolgeler.map((b) => b.ad).filter(Boolean).slice(0, 3);
      if (!bolgeler.length) return undefined;
      return `${bolgeler.join(', ')} — telefon, WhatsApp ve çalışma saatleri.`;
    }

    case 'galeri': {
      const n = isletme.galeri.length;
      return n ? `${n} fotoğraf.` : undefined;
    }

    default:
      return undefined;
  }
}

export function sabitSayfaMetadata(
  isletme: IsletmeTaslak,
  sayfaAnahtari: keyof typeof SAYFA_ADLARI,
  dil: Dil,
  alanAdiEzme?: string,
): SayfaMetadata {
  const varsayilan = isletme.diller.varsayilan;
  const baglam = baglamOlustur(isletme, alanAdiEzme);

  const sayfaAdi = SAYFA_ADLARI[sayfaAnahtari][dil];

  const baslik = baslikGuclendir(
    sigdir([sayfaAdi, markaAdi(isletme)], ' | ', ESIKLER.baslikEnFazla),
    isletme,
    dil,
  );

  /*
     Sira: elle yazilan > sayfaya ozgu malzeme > isletme ozeti.
     Ucuncusu son care; oraya dusen sayfalarin aciklamasi birbirine
     benziyor ve bu bilinerek kabul ediliyor — alternatifi bos aciklama.

     `??` DEGIL `||` — `metin()` bulamadigi degere BOS DIZGE donuyor,
     undefined degil. `??` bos dizgede devam etmedigi icin ilk secenek
     her zaman kazaniyor ve aciklama sadece basliktan ibaret kaliyordu.
     Bunu "aciklamalar birbirinden ayrisiyor" testi YAKALAMADI: uc sayfa
     baslikta zaten farkli oldugu icin test dogru sebeple degil, yanlis
     sebeple geciyordu. Ikinci test (icerik gercekten iceride mi)
     yakaladi.
  */
  const aciklama = aciklamaHazirla(
    [
      `${sayfaAdi} — ${isletme.ad}.`,
      metin(isletme.seo.sayfaAciklamalari?.[sayfaAnahtari], dil, varsayilan) ||
        sabitSayfaMalzemesi(isletme, sayfaAnahtari, dil) ||
        metin(isletme.ozet, dil, varsayilan),
    ],
    isletme,
    dil,
  );

  return govde(
    isletme,
    dil,
    { tur: 'sabit', segment: sayfaAnahtari },
    baslik,
    aciklama,
    [],
    baglam,
  );
}
