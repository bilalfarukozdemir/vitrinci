const TR_HARITA: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i', i: 'i',
  ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  â: 'a', Â: 'a', î: 'i', Î: 'i', û: 'u', Û: 'u',
  ê: 'e', Ê: 'e', ô: 'o', Ô: 'o', é: 'e', É: 'e',
};

const TR_DESEN = /[çÇğĞıIİiöÖşŞüÜâÂîÎûÛêÊôÔéÉ]/g;

/**
 * Turkce metni ASCII kucuk harfe indirger — desen eslestirmesi icin.
 *
 * NEDEN VAR: JavaScript'in regex `i` bayragi Turkce buyuk harflerde
 * calismiyor. /inşaat/i.test("İNŞAAT") === false, cunku "İ" (U+0130)
 * kuculdugunde "i" + birlesen nokta (U+0307) oluyor, duz "i" degil.
 * Ayni sekilde /yapı/i.test("YAPI") === false.
 *
 * Ikinci fayda: isletmeler adlarini bazen aksanli ("Işıklar") bazen
 * aksansiz ("Isiklar") yaziyor; ikisi de ayni sonuca iniyor.
 *
 * Desen eslestiren HER yer bunu kullanmali. Bu fonksiyon yerine
 * `.toLowerCase()` kullanan kod, Turkce buyuk harfli girdide SESSIZCE
 * calismaz — hata vermez, sadece hicbir seyi eslestirmez.
 */
export function trNormalize(metin: string | undefined | null): string {
  return String(metin ?? '')
    .replace(TR_DESEN, (h) => TR_HARITA[h] ?? h)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Turkce karakterleri dogru cevirerek URL-dostu slug uretir.
 * Dikkat: toLowerCase() Turkce "I" harfini yanlis cevirdigi icin
 * once harf haritasini uyguluyoruz.
 */
export function slugla(metin: string, enFazla = 60): string {
  return metin
    .replace(/[çÇğĞıIİiöÖşŞüÜâîûêô]/g, (h) => TR_HARITA[h] ?? h)
    .toLowerCase()
    .replace(/&/g, ' ve ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, enFazla)
    .replace(/-+$/g, '');
}
