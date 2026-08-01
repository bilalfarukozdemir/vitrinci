/**
 * @studio/seo — Katman 1
 *
 * metadata, JSON-LD, sitemap, robots ve hreflang. Hepsi @studio/data
 * semasindan DETERMINISTIK olarak turer — hicbir sayfada elle title
 * yazilmiyor, elle schema yazilmiyor.
 *
 * Sonuc: her yeni musteri sitesi varsayilan olarak en iyi SEO'yu aliyor,
 * ve bu paketteki bir iyilestirme butun musterilere geriye donuk gidiyor.
 *
 * Bu paket next'e bagimli DEGIL — tipler Next.js'in Metadata ve
 * MetadataRoute tipleriyle yapisal olarak uyumlu, ama cerceve bilgisi yok.
 */

export {
  SEGMENTLER,
  yol,
  kanonik,
  dilAlternatifleri,
  dilMi,
  type SegmentAnahtari,
  type SayfaTuru,
  type RotaBaglami,
} from './rotalar.ts';

export {
  ESIKLER,
  SAYFA_ADLARI,
  metin,
  kirp,
  sigdir,
  anaHizmet,
  anaSehir,
  markaAdi,
  ogYereli,
  bolgeCumlesi,
} from './metin.ts';

export {
  baglamOlustur,
  anasayfaMetadata,
  hizmetMetadata,
  bolgeMetadata,
  sabitSayfaMetadata,
  bolgeSlugu,
  type SayfaMetadata,
} from './metadata.ts';

export {
  schemaTipi,
  isletmeLd,
  hizmetLd,
  sssLd,
  kirintiLd,
  siteLd,
  anasayfaGrafi,
  ldMetni,
  type Ld,
} from './jsonld.ts';

export {
  sayfaTanimlari,
  sitemapUret,
  robotsUret,
  type SitemapKaydi,
  type RobotsKurallari,
} from './tarama.ts';
