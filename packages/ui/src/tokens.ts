import type { Marka } from '@studio/data';

/**
 * Marka token'larindan CSS custom property uretir.
 *
 * BU DOSYA MIMARININ SINIRI. Bloklar renk/font/kose degeri HARDCODE ETMEZ;
 * hepsi buradan gelen degiskenleri okur. Boylece:
 *   - her site kendi temasiyla tamamen farkli gorunur ("sinirsiz ucu acik
 *     tasarim" satis argumani korunur)
 *   - ama altyapi ortak kalir, bir iyilestirme butun sitelere gider
 *
 * Bir blok `#fff` yaziyorsa mimari o noktada delinmis demektir.
 */

const KOSE_YARICAPI = {
  keskin: '0px',
  yumusak: '10px',
  yuvarlak: '999px',
} as const;

/** Ton, blok secimini ve bosluk ritmini etkiler; CSS tarafinda data-ton ile okunur. */
const TON_RITMI = {
  kurumsal: '1',
  sicak: '1.05',
  premium: '1.15',
  teknik: '0.95',
  canli: '1',
} as const;

export type TokenSecenekleri = {
  /** Karanlik tema icin ayri bir palet uretilsin mi. */
  koyu?: boolean;
};

/**
 * @returns `--marka-*` seklinde CSS degisken bloklari (suslu parantez YOK,
 *          cagiran taraf `:root { ... }` icine koyar).
 */
export function markaTokenlari(marka: Marka, secenekler: TokenSecenekleri = {}): string {
  const r = marka.renkler;

  const arkaplan = r.arkaplan ?? (secenekler.koyu ? '#0b0d12' : '#ffffff');
  const yuzey = r.yuzey ?? (secenekler.koyu ? '#141821' : '#f6f6f4');
  const metin = r.metin ?? (secenekler.koyu ? '#edeef2' : '#12141a');

  /**
   * "Vitrin": fotograf seritlerinin zemini. HER IKI TEMADA DA KOYU.
   *
   * Sebep: demolarda kullanilan fotograflar isletmenin Google kaydindan
   * geliyor, yani telefonla cekilmis. Acik zeminde soluk goruniyorlar;
   * koyu zeminde ayni fotograf cok daha iyi duruyor. Fotografi one
   * cikarmak isteyen her blok bu token'i kullanir.
   */
  const vitrin = secenekler.koyu ? yuzey : metin;
  const vitrinMetin = secenekler.koyu ? metin : arkaplan;

  const satirlar: string[] = [
    `--marka-ana: ${r.ana};`,
    `--marka-vurgu: ${r.vurgu ?? r.ana};`,
    `--marka-arkaplan: ${arkaplan};`,
    `--marka-yuzey: ${yuzey};`,
    `--marka-metin: ${metin};`,
    `--marka-soluk: ${r.soluk ?? (secenekler.koyu ? '#8a93a6' : '#666e7d')};`,
    `--marka-vitrin: ${vitrin};`,
    `--marka-vitrin-metin: ${vitrinMetin};`,
    `--marka-kose: ${KOSE_YARICAPI[marka.kose]};`,
    `--marka-ritim: ${TON_RITMI[marka.ton]};`,
  ];

  if (marka.yaziTipi?.baslik) satirlar.push(`--marka-baslik-font: ${marka.yaziTipi.baslik};`);
  if (marka.yaziTipi?.govde) satirlar.push(`--marka-govde-font: ${marka.yaziTipi.govde};`);

  return satirlar.join('\n  ');
}

/** `<style>` etiketine dogrudan basilabilir tam blok. */
export function markaStili(marka: Marka, koyuMarka?: Marka): string {
  const acik = `:root {\n  ${markaTokenlari(marka)}\n}`;
  if (!koyuMarka) return acik;

  const koyu = markaTokenlari(koyuMarka, { koyu: true });
  return [
    acik,
    `@media (prefers-color-scheme: dark) {\n  :root {\n    ${koyu}\n  }\n}`,
    `:root[data-tema="koyu"] {\n  ${koyu}\n}`,
    `:root[data-tema="acik"] {\n  ${markaTokenlari(marka)}\n}`,
  ].join('\n\n');
}
