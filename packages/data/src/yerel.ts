import { z } from 'zod';

/**
 * Desteklenen diller. Yeni dil eklemek buraya bir satir; asagi akista
 * hicbir sey degismez — SEO paketi hreflang'i, UI dil secicisini buradan uretir.
 */
export const DILLER = ['tr', 'en', 'de', 'ar', 'ru', 'fr', 'es'] as const;

export type Dil = (typeof DILLER)[number];

export const dilSemasi = z.enum(DILLER);

/** Saga yazilan diller — UI yon (dir) secimi icin. */
export const SAGDAN_SOLA: readonly Dil[] = ['ar'];

/**
 * Yerellestirilebilir deger.
 *
 * Tek dilli musteride duz deger yazarsin:      ozet: "41 yildir avlu dosuyoruz"
 * Cok dilliye gecerken ayni alana nesne:       ozet: { tr: "...", en: "...", ar: "..." }
 *
 * Sema degismedigi icin tek dilliden cok dilliye gecis migration gerektirmiyor.
 * Bu, ihracatci nisine satis yapacaksan bedava aldigin bir opsiyon.
 */
export type Yerelli<T> = T | Partial<Record<Dil, T>>;

const gecerliDilAnahtarlari = new Set<string>(DILLER);

export const yerelli = <T extends z.ZodTypeAny>(sema: T) =>
  z.union([
    sema,
    z
      .record(z.string(), sema)
      .refine((nesne) => Object.keys(nesne).every((k) => gecerliDilAnahtarlari.has(k)), {
        message: `Dil kodu şunlardan biri olmalı: ${DILLER.join(', ')}`,
      })
      .refine((nesne) => Object.keys(nesne).length > 0, {
        message: 'En az bir dil tanımlanmalı',
      }),
  ]);

const dilNesnesiMi = <T>(deger: Yerelli<T>): deger is Partial<Record<Dil, T>> => {
  if (deger === null || typeof deger !== 'object' || Array.isArray(deger)) return false;
  const anahtarlar = Object.keys(deger);
  return anahtarlar.length > 0 && anahtarlar.every((k) => gecerliDilAnahtarlari.has(k));
};

/**
 * Yerelli bir degeri istenen dile cozer.
 * Sirasiyla: istenen dil → varsayilan dil → mevcut ilk dil.
 */
export function coz<T>(deger: Yerelli<T> | undefined, dil: Dil, varsayilan: Dil = 'tr'): T | undefined {
  if (deger === undefined) return undefined;
  if (!dilNesnesiMi(deger)) return deger;

  return deger[dil] ?? deger[varsayilan] ?? Object.values(deger).find((v) => v !== undefined);
}

/** coz() ile ayni ama deger yoksa hata atar — zorunlu alanlar icin. */
export function cozZorunlu<T>(deger: Yerelli<T>, dil: Dil, varsayilan: Dil = 'tr'): T {
  const sonuc = coz(deger, dil, varsayilan);
  if (sonuc === undefined) {
    throw new Error(`Yerelli değer "${dil}" dilinde çözülemedi ve varsayılan da yok.`);
  }
  return sonuc;
}

/** Bir yerelli degerin hangi dillerde tanimli oldugunu dondurur. */
export function tanimliDiller<T>(deger: Yerelli<T> | undefined, varsayilan: Dil = 'tr'): Dil[] {
  if (deger === undefined) return [];
  if (!dilNesnesiMi(deger)) return [varsayilan];
  return (Object.keys(deger) as Dil[]).filter((d) => deger[d] !== undefined);
}
