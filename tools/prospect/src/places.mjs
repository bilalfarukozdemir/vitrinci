import { adresiCoz } from '@studio/data/adapters/prospect';

import { IZINSIZ_TURLER, IZINSIZ_AD_KALIPLARI, SOSYAL_HOSTLAR, adNormalize } from './config.mjs';

const UC_NOKTA = 'https://places.googleapis.com/v1/places:searchText';

// Sadece ihtiyacimiz olan alanlari istiyoruz. Alan listesi genisledikce fatura buyuyor.
const ALAN_MASKESI = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.googleMapsUri',
  'places.primaryTypeDisplayName',
  // types Pro katmaninda; istek zaten Enterprise oldugu icin ek maliyet YOK.
  // Hem alakasiz isletmeleri elemek hem SEKTORU ANLAMAK icin.
  'places.types',

  // Fotograf REFERANSLARI (goruntunun kendisi degil). Referans bedava gelir,
  // goruntuyu indirmek ayri bir istek. Sadece demo yapacagimiz isletmeler icin
  // indiriyoruz — 983 isletmenin fotografini cekmek anlamsiz olurdu.
  'places.photos',

  // Son 5 yorumun METNI. Iki isi birden yapiyor:
  //   1. Isletmenin GERCEKTEN ne yaptigini soyluyor ("bahce mobilyasi aldik")
  //   2. Demoda gercek sosyal kanit oluyor
  // Bu alan istegi Enterprise+Atmosphere katmanina tasiyor: ~$40/1000.
  'places.reviews',

  'nextPageToken',
].join(',');

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fatura notu: yukaridaki alan maskesi websiteUri, nationalPhoneNumber, rating ve
 * userRatingCount istedigi icin istek "Text Search Enterprise" SKU'suna giriyor.
 * Aylik 1.000 istek ucretsiz, sonrasi 1.000 istek basina ~35$.
 *
 * Dordu de zorunlu: site denetim icin, telefon iletisim icin, puan+yorum
 * canlilik skoru icin. Daha ucuz katmana inmek veriyi kaybetmek demek.
 *
 * Buna karsilik tek istek 20 isletme donduruyor — yani isletme basina ~0.00175$.
 * Place Details ile tek tek cekmek 20 kat pahali olurdu.
 */

/**
 * Tek bir metin sorgusu icin Maps sonuclarini ceker (sayfalama dahil).
 * Google tek sorguda en fazla 60 sonuc dondurur; daha fazlasi icin sorguyu
 * cesitlendirmek gerekir (bkz. config.mjs es anlamli sorgular).
 */
async function tekSorgu(sorgu, apiKey, sayac, enFazla = 60) {
  const sonuclar = [];
  let sayfaJetonu;

  do {
    const govde = {
      textQuery: sorgu,
      languageCode: 'tr',
      regionCode: 'TR',
      pageSize: 20,
    };
    if (sayfaJetonu) govde.pageToken = sayfaJetonu;

    sayac.istek++;

    const yanit = await fetch(UC_NOKTA, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': ALAN_MASKESI,
      },
      body: JSON.stringify(govde),
      signal: AbortSignal.timeout(20000),
    });

    if (!yanit.ok) {
      const metin = await yanit.text().catch(() => '');
      throw new Error(`Places API hatası (${yanit.status}) — sorgu: "${sorgu}"\n${metin.slice(0, 500)}`);
    }

    const veri = await yanit.json();
    sonuclar.push(...(veri.places ?? []));
    sayfaJetonu = veri.nextPageToken;

    // Sayfalama jetonunun aktif olmasi icin kisa bir bekleme gerekiyor.
    if (sayfaJetonu && sonuclar.length < enFazla) await bekle(1200);
  } while (sayfaJetonu && sonuclar.length < enFazla);

  return sonuclar.slice(0, enFazla);
}

/**
 * Enterprise + Atmosphere SKU (reviews alani yuzunden): ~$40/1000.
 * Ucretsiz kota aylik 1.000 istek. Google fiyatlari degistiriyor —
 * gercek rakami Cloud Console > Billing'den takip et.
 */
export const AYLIK_UCRETSIZ_ISTEK = 1000;
export const BIN_ISTEK_UCRETI_USD = 40;

/** Alan adindan host cikarir; cozulemezse null. */
export function hostCikar(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/** Site alaninda gercek site degil, sosyal medya profili mi var? */
export function sosyalMedyaMi(url) {
  const host = hostCikar(url);
  return host ? SOSYAL_HOSTLAR.some((s) => host === s || host.endsWith(`.${s}`)) : false;
}

/**
 * Isletme aradigimiz sektore mi ait? Iki katmanli eleme:
 * once Google'in tur etiketleri, sonra ad kaliplari (genel + nise ozgu).
 * @returns {null | string} eleme sebebi, uygunsa null
 */
export function elemeSebebi(yer, nis) {
  const turler = yer.types ?? [];

  // 1. katman: hic kimsenin musterisi olmayanlar — her niste elenir.
  const asla = turler.find((t) => IZINSIZ_TURLER.has(t));
  if (asla) return `tür:${asla}`;

  /*
     2. katman: SEKTOR DISI turler, nise gore.

     Bu ayrim olmadan tek bir liste vardi ve insaata gore yazilmisti;
     `restaurant` ve `hotel` yasakli oldugu icin TURIZM taramasi tam
     olarak aradigi isletmeleri eliyordu. Liste nise bagli olmali.
  */
  const blok = new Set(nis.blokTurler ?? []);
  const sektorDisi = turler.find((t) => blok.has(t));
  if (sektorDisi) return `tür:${sektorDisi}`;

  // Kaliplar ASCII kucuk harfe karsi yaziliyor — `i` bayragi Turkce
  // buyuk harflerde calismadigi icin normalizasyon SART.
  const ad = adNormalize(yer.displayName?.text);

  // 3. katman: HERKES icin gecersiz adlar — kurtarma yok.
  // Tur etiketi bos ya da duz `establishment` gelen kamu tesisleri burada
  // yakalaniyor; Turkiye'de bu istisna degil, kural.
  if (IZINSIZ_AD_KALIPLARI.some((k) => k.test(ad))) return 'ad kalıbı';

  // 4. katman: SEKTOR DISI adlar, nise gore — kurtarma yok.
  // "YAPI RESTAURANT" adinda "yapi" gecse de lokantadir.
  if ((nis.sektorDisiAdKaliplari ?? []).some((k) => k.test(ad))) return 'ad kalıbı';

  // Nise ozgu blok — sektor terimi geciyorsa kurtarilir.
  if ((nis.blokAdKaliplari ?? []).some((k) => k.test(ad))) {
    const kurtarildi = (nis.kurtarmaKaliplari ?? []).some((k) => k.test(ad));
    if (!kurtarildi) return 'ad kalıbı';
  }

  return null;
}

/**
 * Ham kayit listesini filtreler.
 *
 * Tarama sirasinda DEGIL, sonrasinda calisir — boylece ayni fonksiyon
 * `--yeniden` modunda kayitli ham veriye de uygulanabiliyor. Filtre
 * ayarlarini denemek icin bir daha API kotasi harcamiyorsun.
 */
export function filtrele(hamKayitlar, nis, hedefIller = []) {
  const eleme = { tur: 0, ad: 0, kapali: 0, bolge: 0 };
  const kalan = [];

  for (const k of hamKayitlar) {
    if (k.durum && k.durum !== 'OPERATIONAL') {
      eleme.kapali++;
      continue;
    }

    const sebep = elemeSebebi(
      { displayName: { text: k.ad }, types: k.turler ?? [] },
      nis,
    );
    if (sebep) {
      if (sebep.startsWith('tür:')) eleme.tur++;
      else eleme.ad++;
      continue;
    }

    // Bolge kontrolu: Google semantik esleme yaptigi icin aranmayan
    // sehirlerden kayit donderebiliyor (Duzce arandi, Ankara geldi).
    if (hedefIller.length) {
      const { il } = adresiCoz(k.adres, k.sehir);
      const uygun = hedefIller.some(
        (hedef) => adNormalize(il) === adNormalize(hedef),
      );
      if (!uygun) {
        eleme.bolge++;
        continue;
      }
    }

    kalan.push(k);
  }

  return { kalan, eleme };
}

/**
 * Ayni isletmenin birden fazla Maps kaydini teke indirir.
 * Es kabul kriteri: ayni alan adi VEYA ayni telefon.
 * En cok yorumu olan kayit temsilci olarak kalir.
 *
 * Sosyal medya hostlari (instagram.com gibi) alan adi olarak SAYILMAZ —
 * yoksa Instagram'i olan butun isletmeler tek kayda iner.
 */
export function tekillestir(isletmeler) {
  const anahtarla = new Map();
  const sonuc = [];

  for (const isletme of isletmeler.sort((a, b) => (b.yorumSayisi ?? 0) - (a.yorumSayisi ?? 0))) {
    const host = isletme.sosyalMedya ? null : hostCikar(isletme.site);
    const telefon = isletme.telefon?.replace(/\D/g, '') || null;

    const anahtarlar = [host && `alan:${host}`, telefon && `tel:${telefon}`].filter(Boolean);
    const zatenVar = anahtarlar.find((a) => anahtarla.has(a));

    if (zatenVar) continue;

    for (const a of anahtarlar) anahtarla.set(a, isletme.id);
    sonuc.push(isletme);
  }

  return sonuc;
}

/**
 * Nis x sehir kombinasyonlarini tarayip tekilleştirilmiş isletme listesi dondurur.
 * @returns {Promise<{isletmeler: Array<object>, istekSayisi: number}>}
 */
export async function isletmeleriTara({ nis, sehirler, apiKey, ilceKullan = true, ilerleme = () => {} }) {
  const havuz = new Map();
  const sayac = { istek: 0 };

  for (const sehirAdi of sehirler) {
    const bolgeler = ilceKullan && sehirAdi.ilceler?.length ? sehirAdi.ilceler : [sehirAdi.ad];

    for (const bolge of bolgeler) {
      for (const terim of nis.sorgular) {
        const sorgu = `${terim} ${bolge}`;
        let bulunan = [];

        try {
          bulunan = await tekSorgu(sorgu, apiKey, sayac);
        } catch (hata) {
          ilerleme({ sorgu, durum: 'hata', mesaj: hata.message });
          continue;
        }

        let yeni = 0;
        for (const yer of bulunan) {
          if (!yer.id || havuz.has(yer.id)) continue;

          // Filtreleme burada DEGIL, taramadan sonra yapiliyor — ham veri
          // diske yazilsin ki filtre ayarlari kota harcamadan denenebilsin.
          havuz.set(yer.id, {
            id: yer.id,
            ad: yer.displayName?.text ?? '(isimsiz)',
            adres: yer.formattedAddress ?? '',
            site: yer.websiteUri ?? null,
            sosyalMedya: sosyalMedyaMi(yer.websiteUri),
            telefon: yer.nationalPhoneNumber ?? null,
            puan: typeof yer.rating === 'number' ? yer.rating : null,
            yorumSayisi: yer.userRatingCount ?? 0,
            durum: yer.businessStatus ?? 'BILINMIYOR',
            mapsUrl: yer.googleMapsUri ?? '',
            tur: yer.primaryTypeDisplayName?.text ?? '',
            turler: yer.types ?? [],

            // Referanslar; goruntuler demo asamasinda indiriliyor.
            fotograflar: (yer.photos ?? []).slice(0, 8).map((f) => ({
              ad: f.name,
              genislik: f.widthPx,
              yukseklik: f.heightPx,
              katki: f.authorAttributions?.[0]?.displayName ?? null,
            })),

            yorumlar: (yer.reviews ?? []).map((y) => ({
              yazar: y.authorAttribution?.displayName ?? 'Google kullanıcısı',
              yazarUrl: y.authorAttribution?.uri ?? null,
              puan: y.rating ?? null,
              metin: y.text?.text ?? y.originalText?.text ?? '',
              zaman: y.relativePublishTimeDescription ?? null,
            })).filter((y) => y.metin.trim().length > 0),

            sorgu: terim,
            sehir: sehirAdi.ad,
          });
          yeni++;
        }

        ilerleme({
          sorgu,
          durum: 'ok',
          bulunan: bulunan.length,
          yeni,
          toplam: havuz.size,
          istek: sayac.istek,
        });
        await bekle(250); // kota dostu olalim
      }
    }
  }

  const ham = [...havuz.values()];
  const hedefIller = sehirler.map((s) => s.ad);
  const { kalan, eleme } = filtrele(ham, nis, hedefIller);
  const tekil = tekillestir(kalan);

  return {
    isletmeler: tekil,
    // Ham veri: filtrelenmemis, tekillestirilmemis. Diske yaziliyor ki
    // --yeniden modu kota harcamadan yeniden isleyebilsin.
    ham,
    istekSayisi: sayac.istek,
    eleme: { ...eleme, dublikasyon: kalan.length - tekil.length, kalan: tekil.length },
  };
}
