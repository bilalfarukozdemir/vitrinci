import { isletmeTaslakSemasi, type IsletmeTaslak } from '../isletme.ts';
import { slugla } from '../slug.ts';

/**
 * tools/prospect ciktisinin sekli. Motorun urettigi ham kayit.
 * Bu tip adaptorun SINIRI — motor degisirse sadece bu dosya degisir.
 */
export type ProspectKaydi = {
  id: string;
  ad: string;
  adres?: string;
  site?: string | null;
  telefon?: string | null;
  puan?: number | null;
  yorumSayisi?: number;
  mapsUrl?: string;
  /** Google'in gorunur kategori adi: "Bahçe mobilyası mağazası" */
  tur?: string;
  /** Google'in makine okunur tur etiketleri */
  turler?: string[];
  /** Isletmeyi bulan arama terimi — sektor DEGIL, sadece nereden geldigi */
  sorgu?: string;
  sehir?: string;
  yorumlar?: {
    yazar: string;
    yazarUrl?: string | null;
    puan?: number | null;
    metin: string;
    zaman?: string | null;
  }[];
};

/**
 * Google'in bolge etiketlerini sade il adina indirger.
 * "İstanbul - Asya" → "İstanbul", "Sakarya (Adapazari)" → "Sakarya"
 *
 * Bu normalizasyon olmadan bolge filtresi calismaz: aranan sehir "Sakarya"
 * iken adresten "Sakarya (Adapazari)" cikarsa esitlik tutmaz.
 */
export function ilNormalize(il: string): string {
  return il
    .replace(/\s*\([^)]*\)/g, '')   // "Sakarya (Adapazari)" → "Sakarya"
    .replace(/\s*[-–]\s*\S.*$/, '') // "İstanbul - Asya"     → "İstanbul"
    .replace(/\s+/g, ' ')
    .trim();
}

/** "81100 Düzce Merkez/Düzce, Türkiye" → { il: "Düzce", ilce: "Düzce Merkez", postaKodu: "81100" } */
export function adresiCoz(adres: string | undefined, sehirIpucu?: string) {
  const bos = { il: sehirIpucu ?? '', ilce: undefined as string | undefined, postaKodu: undefined as string | undefined, sokak: undefined as string | undefined };
  if (!adres) return bos;

  const parcalar = adres.split(',').map((p) => p.trim()).filter(Boolean);
  if (!parcalar.length) return bos;

  // Son parca genelde ulke; ondan onceki parca "posta kodu Ilce/Il" kalibinda.
  const sonu = parcalar.at(-1) ?? '';
  const ulkeMi = /türkiye|turkey|turkiye/i.test(sonu);
  const bolgeParcasi = (ulkeMi ? parcalar.at(-2) : sonu) ?? '';

  const postaKodu = bolgeParcasi.match(/\b(\d{5})\b/)?.[1];
  const bolgeMetni = bolgeParcasi.replace(/\b\d{5}\b/, '').trim();

  let il = sehirIpucu ?? '';
  let ilce: string | undefined;

  if (bolgeMetni.includes('/')) {
    const [solTaraf, sagTaraf] = bolgeMetni.split('/').map((p) => p.trim());
    ilce = solTaraf || undefined;
    il = sagTaraf || il;
  } else if (bolgeMetni) {
    il = bolgeMetni;
  }

  // Sokak: bolge parcasindan onceki her sey.
  const bolgeIndeksi = parcalar.indexOf(bolgeParcasi);
  const sokak = bolgeIndeksi > 0 ? parcalar.slice(0, bolgeIndeksi).join(', ') : undefined;

  return { il: ilNormalize(il), ilce, postaKodu, sokak };
}

/**
 * Turk CEP numarasini WhatsApp'in bekledigi uluslararasi formata cevirir.
 *
 * SABIT HAT VERILIRSE undefined DONER — bilerek.
 *
 * Onceki surum her numarayi ceviriyordu. Bir prospect'in numarasi
 * (0264) ile basliyordu, yani Sakarya sabit hatti; ondan +90264... diye
 * bir WhatsApp bagi uretilmisti. O bag calismiyor: hem bize "musteriye
 * WhatsApp'tan yaz" dedirtiyordu hem de demonun kendi sayfasinda
 * isletmenin musterilerine kirik bir buton gosteriyordu.
 *
 * TR cep numaralari 5 ile baslar (5xx). Alan koduyla baslayan her sey
 * sabit hattir ve WhatsApp'i yoktur; o isletmeyi ARAMAK gerekiyor.
 */
function whatsappNumarasi(telefon: string | null | undefined): string | undefined {
  if (!telefon) return undefined;

  const rakamlar = telefon.replace(/\D/g, '');

  let yerel: string | undefined;
  if (rakamlar.startsWith('90') && rakamlar.length === 12) yerel = rakamlar.slice(2);
  else if (rakamlar.startsWith('0') && rakamlar.length === 11) yerel = rakamlar.slice(1);
  else if (rakamlar.length === 10) yerel = rakamlar;

  if (!yerel || !yerel.startsWith('5')) return undefined;
  return `+90${yerel}`;
}

/**
 * Prospect kaydini kanonik taslak isletmeye cevirir.
 *
 * Bu fonksiyon, "tarama → demo → gercek site" zincirinin ilk halkasi.
 * Motorun ad-hoc cikti sekli burada bitiyor; bu noktadan sonra butun
 * sistem tek bir sekli taniyor.
 *
 * Onemli: seo.indekslenebilir = false ve kaynak.musteriOnayli = false.
 * Maps verisi musteri dogrulamadan yayina cikmaz.
 */
export function prospecttenTaslak(
  kayit: ProspectKaydi,
  secenekler: { taranmaTarihi?: string } = {},
): IsletmeTaslak {
  const { il, ilce, postaKodu, sokak } = adresiCoz(kayit.adres, kayit.sehir);

  return isletmeTaslakSemasi.parse({
    // Yedek slug'i da slugla()'dan geciriyoruz: Maps place id'leri buyuk harf
    // iceriyor, sema ise sadece kucuk harf kabul ediyor.
    slug: slugla(kayit.ad) || `isletme-${slugla(kayit.id.slice(0, 8))}`,
    ad: kayit.ad,

    // DIKKAT: sektor Google'in kategorisinden geliyor, arama teriminden DEGIL.
    // "bahçe düzenleme" aramasinda cikan isletme, bahce MOBILYASI magazasi
    // olabiliyor — sorguya guvenmek baskasinin isi hakkinda yanlis iddia uretiyor.
    sektor: kayit.tur || kayit.sorgu,
    googleTurleri: kayit.turler ?? [],

    iletisim: {
      telefon: kayit.telefon ?? undefined,
      whatsapp: whatsappNumarasi(kayit.telefon),
    },

    adresler: il
      ? [{ sokak, ilce, il, postaKodu, ulke: 'TR', mapsUrl: kayit.mapsUrl, ziyaretEdilebilir: true }]
      : [],

    hizmetVerilenBolgeler: il
      ? [{ ad: il, tur: 'il' as const, il, ulke: 'TR', sayfaAc: false }]
      : [],

    gbpMetrikleri: {
      puan: kayit.puan ?? undefined,
      yorumSayisi: kayit.yorumSayisi,
    },

    // Google yorumlari kanonik `referanslar` alanina giriyor — kaynak
    // isaretli, yazar ve link korunuyor. Not: bunlar sayfada GOSTERILIYOR
    // ama aggregateRating isaretlemesine girmiyor (bkz. @studio/seo/jsonld).
    referanslar: (kayit.yorumlar ?? []).map((y) => ({
      yazar: y.yazar,
      metin: y.metin,
      puan: y.puan ?? undefined,
      tarih: y.zaman ?? undefined,
      kaynak: 'google' as const,
      kaynakUrl: y.yazarUrl ?? undefined,
    })),

    seo: {
      gbpUrl: kayit.mapsUrl,
      // Demo asamasinda arama motorlarina kapali.
      indekslenebilir: false,
    },

    kaynak: {
      tur: 'maps' as const,
      mapsPlaceId: kayit.id,
      taranmaTarihi: secenekler.taranmaTarihi,
      musteriOnayli: false,
    },
  });
}
