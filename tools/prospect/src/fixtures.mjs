/**
 * --kuru modunda kullanilan sabit veri seti. Places API'yi hic cagirmaz.
 *
 * Amaci: kota harcamadan butun zinciri (denetim → skor → rapor → kanonik JSON)
 * calistirip dogrulamak. Kayitlar denetimin butun dallarini kasitli olarak
 * geziyor: sitesi olan, sitesi hic olmayan, alan adi cozulmeyen, eski/bos
 * sayfaya sahip. Ilk calistirmada bu ceset akisin ucundan ucuna calistigini
 * gosterir.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ISIMLER HAYALI, ALAN ADLARI KAYDA KAPALI
 *
 * `.example` uzantisi RFC 2606'da tam bu is icin ayrildi — kimse
 * kaydettiremez, dolayisiyla kimsenin olamaz. Telefonlar `555 55 55` ile
 * bitiyor. Ikisi de sizinti denetcisinin (`npm run sizinti`) tanidigi
 * kalip: kalıba uymayan bir numara ya da alan adi buraya girerse denetci
 * onu gercek veri sayip alarm veriyor.
 *
 * UC KAYIT GERCEKTEN COZULEN adresler kullaniyor: example.com/org/net.
 * Bunlar da ayrilmis adlar ama `.example` TLD'sinin aksine IANA
 * tarafindan barindiriliyor, yani HTTP cevabi veriyorlar.
 *
 * Sebep ilk izlenim: hepsi cozulmeyen adres olsaydi kuru moddaki her
 * rapor tek satirlik "siteye erisilemiyor" bulgusu tasirdi ve araci ilk
 * kez calistiran biri "bu tek satir yaziyormus" izlenimiyle kapatirdi.
 * Bunu bagimsiz bir kullanilabilirlik incelemesi gosterdi.
 *
 * Yine de skor olceginin UST ucu — "iyi bir site kac puan alir" —
 * ancak gercek, calisan bir site ile kalibre edilebiliyor. Onun icin
 * asagiya bak.
 * ─────────────────────────────────────────────────────────────────────
 *
 * KENDI SITELERINLE KALIBRASYON
 *
 * `tools/prospect/src/fixtures.yerel.mjs` olustur, ayni bicimde bir
 * `KURU_ISLETMELER` disa aktar; bu dosya varsa tercih edilir. O dosya
 * .gitignore'da — gercek adresler yerelde kalir, denetci de kizmaz.
 */
const HAYALI_ISLETMELER = [
  {
    id: 'fixture-tas',
    ad: 'Kavakdere Taş Döşeme',
    adres: 'Fatih Mah. D-100 Karayolu No:532, 81100 Düzce Merkez/Düzce, Türkiye',
    site: 'https://example.org',
    telefon: '0380 555 55 55',
    puan: 4.8,
    yorumSayisi: 34,
    durum: 'OPERATIONAL',
    mapsUrl: 'https://maps.google.com/?q=kavakderetas',
    tur: 'Taş döşeme',
    sorgu: 'kilit taşı döşeme',
    sehir: 'Düzce',
  },
  {
    id: 'fixture-cokdilli',
    ad: 'ZEFİR FX',
    adres: 'Maslak, 34398 Sarıyer/İstanbul, Türkiye',
    site: 'https://example.net',
    telefon: '0212 555 55 55',
    puan: 5.0,
    yorumSayisi: 12,
    durum: 'OPERATIONAL',
    mapsUrl: 'https://maps.google.com/?q=zefirfx',
    tur: 'Organizasyon',
    sorgu: 'havai fişek gösterisi',
    sehir: 'İstanbul',
  },
  {
    id: 'fixture-telefonsuz',
    ad: 'Mürekkep Atölyesi',
    adres: 'Online, Türkiye',
    site: 'https://murekkepatolyesi.example',
    telefon: null,
    puan: 4.9,
    yorumSayisi: 8,
    durum: 'OPERATIONAL',
    mapsUrl: 'https://maps.google.com/?q=murekkepatolyesi',
    tur: 'Hediyelik',
    sorgu: 'kişiye özel hediye',
    sehir: 'İstanbul',
  },
  {
    id: 'fixture-sitesiz',
    ad: 'Pusula İnşaat Müteahhitlik',
    adres: 'Cumhuriyet Mah. Atatürk Cad. No:14, 81100 Düzce Merkez/Düzce, Türkiye',
    site: null,
    telefon: '0374 555 55 55',
    puan: 4.6,
    yorumSayisi: 61,
    durum: 'OPERATIONAL',
    mapsUrl: 'https://maps.google.com/?q=pusulainsaat',
    tur: 'Müteahhit',
    sorgu: 'müteahhit',
    sehir: 'Düzce',
  },
  {
    id: 'fixture-zayif',
    ad: 'Fidanlık Peyzaj Bahçe',
    adres: 'Şerefiye Mah. No:8, 81600 Akçakoca/Düzce, Türkiye',
    // Erisilemeyen alan adi: denetim bunu "erisilemedi" olarak isaretlemeli.
    site: 'https://bulunmayan-alan-adi-testi.example',
    telefon: '0264 555 55 55',
    puan: 4.2,
    yorumSayisi: 19,
    durum: 'OPERATIONAL',
    mapsUrl: 'https://maps.google.com/?q=fidanlikpeyzaj',
    tur: 'Peyzaj',
    sorgu: 'peyzaj firması',
    sehir: 'Düzce',
  },
  {
    id: 'fixture-eski',
    ad: 'Kestane Doğal Taş',
    adres: 'Sanayi Sit. 3. Blok No:22, 81100 Düzce Merkez/Düzce, Türkiye',
    // Cozulen ama icerigi olmayan adres — cep numarali tek kayit, WhatsApp
    // bagi uretme yolu da boylece kuru modda geziliyor.
    site: 'http://example.com',
    telefon: '0555 555 55 55',
    puan: 3.9,
    yorumSayisi: 7,
    durum: 'OPERATIONAL',
    mapsUrl: 'https://maps.google.com/?q=kestanetas',
    tur: 'Doğal taş',
    sorgu: 'doğal taş uygulama',
    sehir: 'Düzce',
  },
];

/*
   Yerel kalibrasyon seti varsa onu kullan. Yoksa hayali set.
   Dosyanin yoklugu normal durum — hata degil, sessizce geciliyor.
*/
let yerel;
try {
  ({ KURU_ISLETMELER: yerel } = await import('./fixtures.yerel.mjs'));
} catch {
  /* fixtures.yerel.mjs yok — yayınlanan hayali set kullanılıyor */
}

export const KURU_ISLETMELER = yerel ?? HAYALI_ISLETMELER;
