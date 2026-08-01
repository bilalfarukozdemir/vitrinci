/**
 * Firma adindan olasi alan adlarini turetip gercekten var mi diye bakar.
 *
 * NEDEN VAR: Google Places `websiteUri` alanini bos donuyorsa bu "sitesi
 * yok" demek DEGIL, "Google bilmiyor" demek. Isletme sitesini profiline
 * baglamamis olabilir.
 *
 * Bunu iki kez pahaliya ogrendik:
 *   - Bir insaat firmasi   → sehir adi + firma adi biciminde bir adresi
 *                            vardi, elle bulundu
 *   - Iki kelimelik bir    → adi harfi harfine .com.tr'ydi ve bunu MESAJ
 *     duvar ustasi           GONDERILDIKTEN SONRA fark ettik
 *
 * Ikincisi tam olarak bu kontrolun yakalayacagi durumdu: iki kelimelik
 * firma adindan `<adsoyad>.com.tr` dogrudan turetilebiliyor.
 *
 * NE YAKALAYAMAZ: adiyla ilgisi olmayan alan adlari. Bir prospect'in adi
 * "... Ticaret"ti ama sitesi "...yapi.com" idi; adres sadece dukkan
 * tabelasinda yaziyordu. Bu araç bir garanti degil, ucuz bir ilk suzgec.
 *
 * SAHTE POZITIF TEHLIKESI: bir alan adinin cozumlenmesi onlara ait
 * demek degil — park edilmis ve satilik adresler de cozumleniyor.
 * O yuzden sayfada TELEFON NUMARASI ariyoruz. Numara eslesirse site
 * kesin onlarindir; eslesmezse "belki" diyoruz, "kesin" demiyoruz.
 */
import { resolve4, resolve6 } from 'node:dns/promises';

/** Alan adina donusturulurken atilacak jenerik ekler. */
const JENERIK = new Set([
  'ticaret', 'tic', 'insaat', 'ins', 'sanayi', 'san', 'limited', 'ltd',
  'sirketi', 'sti', 'as', 'anonim', 've', 'group', 'grup', 'firma',
]);

const TR_HARITA = { ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i', ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u' };

const sadelestir = (metin) =>
  String(metin ?? '')
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (h) => TR_HARITA[h] ?? h)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Uzantilar. .com.tr Turkiye'de kucuk isletmelerde yaygin. */
const UZANTILAR = ['com', 'com.tr', 'net', 'org'];

/** Yer adlari. Tek basina alan adi olmaz ama sektorle birlesince olur. */
const YERLER = new Set([
  'duzce', 'sakarya', 'bolu', 'kocaeli', 'zonguldak', 'istanbul', 'ankara',
  'akyazi', 'hendek', 'kocaali', 'sapanca', 'serdivan', 'karasu', 'merkez',
]);

/** Sektor kelimeleri. Ikisi bir arada jenerik adres uretiyor, ayrica ele alinir. */
const SEKTOR = new Set([
  'tadilat', 'yapi', 'duvar', 'peyzaj', 'dekorasyon', 'emlak', 'beton',
  'hafriyat', 'komple', 'bahce', 'insaat', 'cati', 'nalbur', 'malzeme',
  'malzemeleri', 'fidancilik', 'muhendislik', 'mimarlik',
]);

const ayirtEdici = (k) => !YERLER.has(k) && !SEKTOR.has(k);

/**
 * Firma adindan denenecek alan adi govdelerini uretir.
 *
 * "KAVAK DUVAR"                        → kavakduvar
 * "OZDEN TICARET"                      → ozdenticaret, ozden
 * "Hendek Komple Dekorasyon & Ergin Yapi" → hendekdekorasyon, erginyapi, ...
 *
 * NEDEN BUTUN CIFTLER, SADECE KOMSULAR DEGIL: ilk surum yalnizca
 * "ilk iki" ve "son iki" kelimeyi birlestiriyordu. Yukaridaki dort
 * kelimelik ad icin `duzcekomple` uretti ama gercek adres
 * `hendekdekorasyon.com` idi — birinci ve UCUNCU kelime. Kacirdi.
 * Artik sirasi korunmak sartiyla butun ikili kombinasyonlar deneniyor.
 */
export function adayGovdeler(ad) {
  const kelimeler = sadelestir(ad).split(' ').filter((k) => k.length > 1);
  if (!kelimeler.length) return [];

  // Cok uzun adlarda kombinasyon patlamasin: ilk 6 anlamli kelime yeter.
  const anlamli = kelimeler.filter((k) => !JENERIK.has(k)).slice(0, 6);
  const govdeler = new Set();

  const ekle = (g) => {
    if (g && g.length >= 4 && g.length <= 63) govdeler.add(g);
  };

  ekle(kelimeler.join(''));
  ekle(anlamli.join(''));

  // Sirali butun ikili kombinasyonlar: (0,1), (0,2), (1,2), ...
  //
  // IKISI DE SEKTOR KELIMESIYSE ATLA. `tadilatdekorasyon.com` ve
  // `bahcepeyzaj.com.tr` gercekten var ama bu isletmelerin degil —
  // jenerik adresler. Buna karsilik `duzcetadilat` (yer+sektor) ve
  // `mertduvar` (marka+sektor) tam da aranan sey. Bu filtre olmadan
  // her peyzajci ve her tadilatci ayni sahte pozitifi ureti- yordu.
  for (let i = 0; i < anlamli.length; i++) {
    for (let j = i + 1; j < anlamli.length; j++) {
      if (SEKTOR.has(anlamli[i]) && SEKTOR.has(anlamli[j])) continue;
      ekle(anlamli[i] + anlamli[j]);
    }
  }

  // TEK KELIME DENENMIYOR — bilerek.
  //
  // 40 kayitlik gercek taramada tek kelimelik adaylar neredeyse butun
  // gurultuyu uretti. Cikanlar: bir tibbi cihaz ithalatcisi, bir ABD'li
  // yazilim sirketi, Puerto Riko'da bir dukkan, satilik bir alan adi ve
  // bir fuarcilik sirketi. Hicbiri Duzceli bir insaatci degildi.
  // Tek kelimelik .com adresleri neredeyse her zaman baskasinin.
  // Iki kelimelik birlesimler ise gercekten isabet ediyor.

  return [...govdeler];
}

/** Alan adi DNS'te var mi? Cozumlenmiyorsa hic HTTP denemiyoruz. */
async function cozumleniyorMu(alanAdi) {
  for (const sorgu of [resolve4, resolve6]) {
    try {
      const sonuc = await sorgu(alanAdi);
      if (sonuc?.length) return true;
    } catch {
      /* kayit yok ya da sunucu cevaplamadi — digerini dene */
    }
  }
  return false;
}

/** Sayfada telefon geciyor mu? Bicim farkliliklarini yutmak icin sadece rakamlar. */
function telefonGeciyorMu(html, telefon) {
  const hedef = String(telefon ?? '').replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '');
  if (hedef.length < 10) return false;
  const sayfa = html.replace(/\D/g, '');
  return sayfa.includes(hedef);
}

/**
 * Bir isletme icin olasi siteyi arar.
 *
 * GUVEN SEVIYELERI — ucu de gercek taramadan cikti:
 *   kesin  telefon numarasi sayfada geciyor. Tartisma yok.
 *   guclu  sayfada isletmenin SEHRI geciyor. Yerel bir firma sitesinde
 *          sehrini mutlaka yazar; yazmiyorsa buyuk ihtimalle baskasidir.
 *          Yukaridaki tibbi cihaz sitesi "Duzce" demiyordu, cunku
 *          Duzceli bir insaatciyla hicbir ilgisi yoktu.
 *   zayif  sadece alan adi tuttu. Muhtemelen baskasinin sitesi.
 *
 * @returns {Promise<null | {alanAdi, durum, kesin, guven, baslik?}>}
 */
export async function siteAra(ad, telefon, { sehir = '', zamanAsimi = 8000 } = {}) {
  for (const govde of adayGovdeler(ad)) {
    for (const uzanti of UZANTILAR) {
      const alanAdi = `${govde}.${uzanti}`;
      if (!(await cozumleniyorMu(alanAdi))) continue;

      let yanit;
      try {
        yanit = await fetch(`https://${alanAdi}`, {
          redirect: 'follow',
          signal: AbortSignal.timeout(zamanAsimi),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StudioProspect/1.0)' },
        });
      } catch {
        continue; // DNS var ama sunucu yok — park edilmis olabilir
      }
      if (!yanit.ok) continue;

      const html = await yanit.text().catch(() => '');
      const kesin = telefonGeciyorMu(html, telefon);
      const sehirGeciyor = sehir ? sadelestir(html).includes(sadelestir(sehir)) : false;

      return {
        alanAdi,
        durum: yanit.status,
        kesin,
        guven: kesin ? 'kesin' : sehirGeciyor ? 'guclu' : 'zayif',
        baslik: (html.match(/<title>([^<]*)<\/title>/i) ?? [])[1]?.trim().slice(0, 120),
      };
    }
  }
  return null;
}
