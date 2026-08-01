/**
 * @studio/data — Katman 0
 *
 * Kanonik isletme semasi. Butun artifact'lar (denetim raporu, demo,
 * musteri sitesi, pazarlama sitesi, teklif) bu sekli okur.
 *
 * Kural: bu paket hicbir seyi import etmez (zod haric). Asagi akista
 * bir seyi bilmek zorunda kalirsa mimari bozulmustur.
 */

export {
  DILLER,
  SAGDAN_SOLA,
  dilSemasi,
  yerelli,
  coz,
  cozZorunlu,
  tanimliDiller,
  type Dil,
  type Yerelli,
} from './yerel.ts';

export { slugla, trNormalize } from './slug.ts';

export {
  // semalar
  isletmeSemasi,
  isletmeTaslakSemasi,
  medyaSemasi,
  adresSemasi,
  bolgeSemasi,
  hizmetSemasi,
  fiyatSemasi,
  referansSemasi,
  sssSemasi,
  calismaSaatiSemasi,
  markaSemasi,
  iletisimSemasi,
  sosyalSemasi,
  seoSemasi,
  kaynakSemasi,
  // yardimcilar
  yayinaHazirMi,
  tamOlarakDogrula,
  // tipler
  type Isletme,
  type IsletmeTaslak,
  type Medya,
  type Hizmet,
  type Bolge,
  type Adres,
  type Referans,
  type Sss,
  type Marka,
  type EksikAlan,
} from './isletme.ts';
