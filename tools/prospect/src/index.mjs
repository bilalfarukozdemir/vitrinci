import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { slugla } from '@studio/data';
import { prospecttenTaslak } from '@studio/data/adapters/prospect';

import { envYukle, kokDizin } from './env.mjs';
import { NISLER, SEHIRLER } from './config.mjs';
import {
  isletmeleriTara,
  filtrele,
  tekillestir,
  AYLIK_UCRETSIZ_ISTEK,
  BIN_ISTEK_UCRETI_USD,
} from './places.mjs';
import { KURU_ISLETMELER } from './fixtures.mjs';
import { siteyiDenetle, hiziOlc } from './audit.mjs';
import { siteAra } from './alanadi.mjs';
import { canlilikPuani, zayiflikPuani, firsatSkoru, oncelikEtiketi, csvUret } from './score.mjs';
import { raporUret, panelUret } from './report.mjs';

envYukle();

// ---------------------------------------------------------------- argumanlar

const argv = process.argv.slice(2);

/*
   SON BAYRAK KAZANIR — ilk degil.

   `npm run tara:kuru` script'in icine `--nis=insaat --sehir=Duzce` gomulu
   ve npm kullanicinin argumanlarini SONA ekliyor. `find` kullanan surumde
   gomulu deger kazaniyordu: `npm run tara:kuru -- --sehir=Ankara`
   calistiran biri Ankara taradigini saniyor, Duzce ciktisina bakiyordu.
   Ne hata ne uyari vardi.

   `findLast` ile kullanicinin verdigi deger kazaniyor; ustune, ayni bayrak
   iki kez gectiyse hangisinin kullanildigi ekrana yaziliyor.
*/
const cakisanlar = [];
const arg = (ad, varsayilan = null) => {
  const hepsi = argv.filter((a) => a.startsWith(`--${ad}=`));
  if (hepsi.length > 1) cakisanlar.push({ ad, deger: hepsi.at(-1).slice(ad.length + 3) });
  return hepsi.length ? hepsi.at(-1).slice(ad.length + 3) : varsayilan;
};
const bayrak = (ad) => argv.includes(`--${ad}`);

if (bayrak('yardim') || bayrak('help') || argv.length === 0) {
  console.log(`
  Prospect Motoru — nis x sehir tarayip firsat skoruna gore siralar.

  Kullanim:
    node src/index.mjs --nis=insaat --sehir=Düzce,Bolu
    node src/index.mjs --nis=ihracatci --sehir=Kocaeli,Bursa --limit=60
    node src/index.mjs --nis=insaat --sehir=Düzce --hiz-yok --ilce-yok

  Parametreler:
    --nis=<ad>        ${Object.keys(NISLER).join(' | ')}
    --sehir=A,B,C     ${Object.keys(SEHIRLER).join(' | ')}
    --limit=N         Kac isletme icin rapor + hiz olcumu yapilsin (varsayilan 40)
    --hiz-yok         PageSpeed olcumunu atla (cok daha hizli biter)
    --ilce-yok        Ilce ilce tarama yapma (daha az API cagrisi, daha az kapsam)
    --kuru            Places API'yi hic cagirmaz, sabit veri setiyle calisir.
                      API anahtari gerekmez. Zinciri test etmek ve skor
                      kalibrasyonunu kontrol etmek icin.
    --yeniden=<klasor>
                      Onceki bir taramanin HAM verisini yeniden isler.
                      Places API'ye HIC dokunmaz — kota harcamaz.
                      Filtre kaliplarini veya skor agirliklarini degistirdikten
                      sonra sonucu gormek icin bunu kullan.
                      Ornek: --yeniden=2026-07-30-insaat-duzce-bolu-sakarya

  Cikti (out/ klasoru):
    <cikti>/prospects.csv       Excel'de acilabilir tam liste
    <cikti>/panel.html          Ic kullanim paneli — PAYLASMA
    <cikti>/raporlar/*.html     Prospect'e gonderilecek raporlar — Vercel'e atilabilir
`);
  process.exit(0);
}

const kuruMod = bayrak('kuru');
const yenidenKlasor = arg('yeniden');
const yenidenMod = Boolean(yenidenKlasor);

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey && !kuruMod && !yenidenMod) {
  console.error('\n  HATA: GOOGLE_API_KEY tanimli degil.\n');
  console.error('  1) .env.example dosyasini .env olarak kopyala');
  console.error('  2) console.cloud.google.com uzerinden bir API anahtari olustur');
  console.error('  3) "Places API (New)" ve "PageSpeed Insights API" servislerini aktif et');
  console.error('  4) Anahtari .env icindeki GOOGLE_API_KEY satirina yaz\n');
  process.exit(1);
}

const nisAnahtar = arg('nis');
const nis = NISLER[nisAnahtar];
if (!nis) {
  console.error(`\n  HATA: gecersiz nis "${nisAnahtar}". Secenekler: ${Object.keys(NISLER).join(', ')}\n`);
  process.exit(1);
}

const sehirAdlari = (arg('sehir') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!sehirAdlari.length) {
  console.error(`\n  HATA: --sehir bos. Secenekler: ${Object.keys(SEHIRLER).join(', ')}\n`);
  process.exit(1);
}

const sehirler = [];
for (const ad of sehirAdlari) {
  if (!SEHIRLER[ad]) {
    console.error(`\n  HATA: tanimsiz sehir "${ad}". config.mjs icine ekleyebilirsin.\n`);
    process.exit(1);
  }
  sehirler.push({ ad, ilceler: SEHIRLER[ad].ilceler });
}

const limit = Number(arg('limit', '40'));
const hizOlc = !bayrak('hiz-yok');
const ilceKullan = !bayrak('ilce-yok');

// ---------------------------------------------------------------- yardimcilar

/** Sabit sayida es zamanli is yuruten basit havuz. */
async function havuzda(liste, esZamanli, isFn) {
  const sonuclar = new Array(liste.length);
  let sonraki = 0;

  const isci = async () => {
    while (sonraki < liste.length) {
      const i = sonraki++;
      sonuclar[i] = await isFn(liste[i], i);
    }
  };

  await Promise.all(Array.from({ length: Math.min(esZamanli, liste.length) }, isci));
  return sonuclar;
}

const yaz = (metin) => process.stdout.write(metin);

// ---------------------------------------------------------------- 1. tarama

// Ayni bayrak iki kez verildiyse hangisinin kazandigini SOYLE. Sessizce
// birini secmek, kullanicinin baska bir sehri taradigini sanmasina yol aciyor.
for (const c of cakisanlar) {
  console.log(`\n  ! --${c.ad} iki kez verildi; sonuncusu kullanılıyor: ${c.deger}`);
}

console.log(`\n  Niş     : ${nis.ad}`);
console.log(`  Şehir   : ${sehirAdlari.join(', ')}`);
console.log(`  Sorgular: ${nis.sorgular.length} terim${ilceKullan ? ' × ilçe bazlı' : ''}`);
console.log(`  Not     : ${nis.not}\n`);

// Cikti klasoru. Yeniden isleme modunda kaynak klasorun icine yaziyoruz —
// ham.json orada duruyor ve degismiyor, sadece turetilmis ciktilar yenileniyor.
/**
 * Ayni gun ayni parametrelerle tekrar tarayinca onceki klasorun uzerine
 * yazilmasin — her tarama gercek API kotasi harciyor. Cakisma varsa -2, -3...
 */
function benzersizKlasor(taban) {
  let ad = taban;
  let sayac = 2;
  while (existsSync(resolve(kokDizin, 'out', ad, 'ham.json'))) {
    ad = `${taban}-${sayac++}`;
  }
  return ad;
}

const calismaAdi = yenidenMod
  ? yenidenKlasor
  : kuruMod
    ? 'kuru'
    : benzersizKlasor(
        [new Date().toISOString().slice(0, 10), nisAnahtar, slugla(sehirAdlari.join('-'))].join('-'),
      );

const ciktiDizin = resolve(kokDizin, 'out', calismaAdi);

let isletmeler;
let hamKayitlar = [];
let istekSayisi = 0;

if (yenidenMod) {
  const hamYol = resolve(ciktiDizin, 'ham.json');
  if (!existsSync(hamYol)) {
    console.error(`\n  HATA: ${hamYol} bulunamadı.`);
    console.error('  Yeniden işleme için o klasörde ham.json olmalı.');
    console.error('  Eski taramalarda bu dosya yok — bir kez normal tarama çalıştırman gerekiyor.\n');
    process.exit(1);
  }

  hamKayitlar = JSON.parse(readFileSync(hamYol, 'utf8'));
  console.log(`  [1/4] YENİDEN İŞLEME — ${hamKayitlar.length} ham kayıt okundu, API çağrılmıyor.`);

  const hedefIller = sehirler.map((s) => s.ad);
  const { kalan, eleme } = filtrele(hamKayitlar, nis, hedefIller);
  isletmeler = tekillestir(kalan);

  console.log(
    `        Elenen: ${eleme.tur} tür · ${eleme.ad} ad · ${eleme.bolge} bölge dışı · ` +
      `${eleme.kapali} kapalı · ${kalan.length - isletmeler.length} mükerrer → ${isletmeler.length} kaldı`,
  );
} else if (kuruMod) {
  console.log('  [1/4] KURU MOD — Places API çağrılmıyor, sabit veri seti kullanılıyor.');
  hamKayitlar = KURU_ISLETMELER;

  // Filtre yolunu kuru modda da calistiriyoruz — dry-run'in amaci butun zinciri
  // denemek. Bolge kontrolu haric: fikstur kasitli olarak birden fazla sehri
  // kapsiyor (kalibrasyon referanslari icin).
  const { kalan, eleme } = filtrele(hamKayitlar, nis, []);
  isletmeler = tekillestir(kalan);
  console.log(`        Elenen: ${eleme.tur} tür · ${eleme.ad} ad → ${isletmeler.length} kaldı`);
} else {
  console.log('  [1/4] Google Maps taranıyor...');

  const sonuc = await isletmeleriTara({
    nis,
    sehirler,
    apiKey,
    ilceKullan,
    ilerleme: ({ sorgu, durum, yeni, toplam, istek, mesaj }) => {
      if (durum === 'hata') {
        console.log(`        ! ${sorgu} — ${String(mesaj).split('\n')[0]}`);
      } else {
        yaz(
          `\r        ${sorgu.padEnd(38).slice(0, 38)} +${String(yeni).padStart(3)} → ${toplam} işletme · ${istek} istek   `,
        );
      }
    },
  });

  isletmeler = sonuc.isletmeler;
  hamKayitlar = sonuc.ham;
  istekSayisi = sonuc.istekSayisi;

  const e = sonuc.eleme;
  console.log(
    `\n        Elenen: ${e.tur} tür · ${e.ad} ad · ${e.bolge} bölge dışı · ` +
      `${e.kapali} kapalı · ${e.dublikasyon} mükerrer → ${e.kalan} kaldı`,
  );
}

console.log(`\n        ${isletmeler.length} tekil işletme bulundu.\n`);

if (!isletmeler.length) {
  console.log('  Sonuç yok. Şehir/niş kombinasyonunu değiştirip tekrar dene.\n');
  process.exit(0);
}

// ---------------------------------------------------------------- 2. denetim

// Onceki calistirmadan kalan denetim sonuclari. Site icerigi saatlik degismedigi
// icin --yeniden modunda bunlari tekrar cekmeye gerek yok; sadece yeni giren
// kayitlar denetleniyor. (Denetim Places kotasi harcamiyor ama yavas.)
const denetimOnbellek = new Map();
const onbellekYolu = resolve(ciktiDizin, 'denetim.json');

if (yenidenMod && existsSync(onbellekYolu)) {
  for (const [id, kayit] of Object.entries(JSON.parse(readFileSync(onbellekYolu, 'utf8')))) {
    denetimOnbellek.set(id, kayit);
  }
}

console.log(
  `  [2/4] Siteler denetleniyor${denetimOnbellek.size ? ` (${denetimOnbellek.size} önbellekten)` : ''}...`,
);

let sayac = 0;
const denetlenen = await havuzda(isletmeler, 8, async (isletme) => {
  const onbellek = denetimOnbellek.get(isletme.id);
  if (onbellek && onbellek.site === (isletme.site ?? null)) {
    yaz(`\r        ${String(++sayac).padStart(4)}/${isletmeler.length}   `);
    return { ...isletme, bulgular: [...onbellek.bulgular], denetim: onbellek.denetim, hiz: onbellek.hiz };
  }

  const bulgular = [];
  let denetim = null;

  if (!isletme.site) {
    bulgular.push('site_yok');
  } else if (isletme.sosyalMedya) {
    // Site alaninda Instagram/Facebook/sahibinden profili var. Bunu web sitesi
    // gibi denetlemek anlamsiz — uretilen rapor bir Instagram sayfasi icin
    // "schema isaretlemesi yok" derdi ve gonderilse itibar kaybi olurdu.
    // Bu grup aslinda en iyi prospect: online varlik istediklerini kanitlamislar.
    bulgular.push('sosyal_medya_site_yok');
  } else {
    denetim = await siteyiDenetle(isletme.site);
    bulgular.push(...denetim.bulgular);

    // Ihracatci nisinde cok dillilik ana satis argumani.
    if (nis.cokDilOnemli && denetim.erisildi && (denetim.olcumler.dilSayisi ?? 0) < 2) {
      bulgular.push('tek_dil');
    }
  }

  if ((isletme.yorumSayisi ?? 0) < 15) bulgular.push('gbp_zayif');

  /*
     SON YORUM TAZELIGI.

     Places API tarihi mutlak degil, "3 hafta once" gibi GORELI bir
     dizge olarak donuyor; `yorumYasiGun` onu yaklasik gune ceviriyor.
     Yaklasik olmasi sorun degil, esik 90 gun.

     Neden 90: sitesiz 402 isletmenin dagiliminda %73'u son 3 ay icinde
     yorum almis. Yani 3 aydan eski olmak GERCEKTEN ayirt edici — daha
     dar bir esik cogunlugu isaretler ve bulgu anlamini yitirirdi.
  */
  const yorumYasi = enYeniYorumYasi(isletme.yorumlar);
  if (yorumYasi != null && yorumYasi > 90) bulgular.push('yorum_eskimis');

  yaz(`\r        ${String(++sayac).padStart(4)}/${isletmeler.length}   `);

  return { ...isletme, bulgular, denetim };
});

console.log('\n');

/**
 * "3 hafta once" gibi goreli bir dizgeyi yaklasik GUNE cevirir.
 *
 * Places API yorum tarihini mutlak vermiyor. Yaklasiklik burada sorun
 * degil: 90 gunluk esikte "10 hafta" ile "70 gun" arasindaki fark
 * kararı degistirmiyor.
 *
 * Cozulemeyen bicimde null donuyor — tahmin etmektense bulgu
 * uretmemek dogru. Bilinmeyen bir tarihi "eski" saymak, isletmeye
 * olmayan bir kusur atfetmek olurdu.
 */
function yorumYasiGun(zaman) {
  const m = String(zaman ?? '').match(/(bir|iki|üç|dört|beş|d+)s*(gün|hafta|ay|yıl)/i);
  if (!m) return null;
  const sayi = { bir: 1, iki: 2, 'üç': 3, 'dört': 4, 'beş': 5 }[m[1].toLowerCase()] ?? Number(m[1]);
  if (!Number.isFinite(sayi)) return null;
  return sayi * { 'gün': 1, hafta: 7, ay: 30, 'yıl': 365 }[m[2].toLowerCase()];
}

/** En yeni yorumun yasi (gun). Yorum yoksa ya da hicbiri cozulemezse null. */
function enYeniYorumYasi(yorumlar) {
  const g = (yorumlar ?? []).map((y) => yorumYasiGun(y.zaman)).filter((n) => n != null);
  return g.length ? Math.min(...g) : null;
}

// ---------------------------------------------------------------- 3. skorlama

/*
   ─────────────────────────────────────────────────────────────────────
   EMSALE GORE YORUM SAYISI.

   "Yorum sayisi dusuk" sabit bir esikle olculemiyor: bir cekiciye 40
   yorum cok, bir yol ustu restorana az. Karsilastirma AYNI TUR ve AYNI
   ILDEKI isletmelerin ORTANCASINA gore yapiliyor.

   Ortalama degil ortanca: tek bir 5.933 yorumlu isletme ortalamayi
   yukari cekip butun mahalleyi "emsalinin altinda" gosteriyordu.

   En az 5 emsal sarti var — uc isletmeden cikan bir "ortanca" olcu
   degil, gurultudur.
   ─────────────────────────────────────────────────────────────────────
*/
{
  const gruplar = new Map();
  for (const k of denetlenen) {
    const anahtar = `${k.tur ?? '?'}|${k.sehir ?? '?'}`;
    if (!gruplar.has(anahtar)) gruplar.set(anahtar, []);
    gruplar.get(anahtar).push(k.yorumSayisi ?? 0);
  }

  const ortancalar = new Map();
  for (const [anahtar, sayilar] of gruplar) {
    if (sayilar.length < 5) continue;
    const s = [...sayilar].sort((a, b) => a - b);
    ortancalar.set(anahtar, s[Math.floor(s.length / 2)]);
  }

  for (const k of denetlenen) {
    const ortanca = ortancalar.get(`${k.tur ?? '?'}|${k.sehir ?? '?'}`);
    // Yarisindan az: "biraz geride" degil, gorunur sekilde geride.
    if (ortanca && ortanca >= 20 && (k.yorumSayisi ?? 0) < ortanca / 2) {
      k.bulgular.push('yorum_rakipten_az');
    }
  }
}

const skorlanan = denetlenen
  .map((k) => {
    const canlilik = canlilikPuani(k);
    const zayiflik = zayiflikPuani(k.bulgular);
    const firsat = firsatSkoru({ canlilik, zayiflik });
    return { ...k, canlilik, zayiflik, firsat, oncelik: oncelikEtiketi(firsat) };
  })
  .sort((a, b) => b.firsat - a.firsat);


const kisaListe = skorlanan.slice(0, limit);

/*
   ─────────────────────────────────────────────────────────────────────
   ALAN ADI KONTROLU — SADECE KISA LISTE.

   Her aday icin birkac DNS + HTTP istegi demek; 2.696 isletmede
   dakikalar surer ve cogu zaten rapor almayacak. Kisa listede ~40
   isletme var, orada maliyeti kabul edilebilir.

   YALNIZCA SITESI OLMAYANDA calisiyor — sitesi olanin adresi zaten
   belli, aramanin anlami yok.

   IKI FARKLI SONUC, iki farkli anlam:

     kesin   Telefon numarasi sayfada geciyor. Site ASLINDA VAR ve
             tarama kacirmis. Bu durumda `site_yok` bulgusu KALDIRILIYOR
             — "siteniz yok" diye rapor gondermek yanlis olurdu.
     digeri  Adres kayitli ama isletmenin oldugu dogrulanamiyor. Satis
             acisindan asil sey bu: adinizdan tureyen alan adi baskasinin
             elinde.

   Gercek bir vakada birincisi oldu: aile adindan tureyen `.com.tr`
   adresi isletmenindi, tarama bulamadi, "siteniz yok" varsayimiyla demo
   gitti. Hatayi kullanici yakaladi.
   ─────────────────────────────────────────────────────────────────────
*/
{
  const sitesizler = kisaListe.filter((k) => !k.site);
  if (sitesizler.length) {
    console.log(`  [3/4] Alan adı kontrolü (${sitesizler.length} sitesiz işletme)...`);
    let sayilan = 0;
    await havuzda(sitesizler, 4, async (k) => {
      const bulunan = await siteAra(k.ad, k.telefon, { sehir: k.sehir ?? '', zamanAsimi: 7000 });
      yaz(`\r        ${String(++sayilan).padStart(3)}/${sitesizler.length}   `);
      if (!bulunan) return;

      if (bulunan.kesin) {
        /*
           SITE ASLINDA VAR — ama rapor BOS KALMAMALI.

           Ilk surumde sadece `site_yok` kaldiriliyordu ve geriye hicbir
           bulgu kalmayan isletmeler icin bombos rapor uretildi. Bos bir
           "analiz" gondermek, hic gondermemekten kotu.

           Bulunan site simdi DENETLENIYOR: baslik, aciklama, sema,
           telefon, harita. Boylece rapor "siteniz yok"tan "siteniz var
           ama sunlar eksik"e donuyor — ki satis acisi da o.
        */
        k.site = `https://${bulunan.alanAdi}`;
        k.gizliSite = bulunan.alanAdi;
        k.bulgular = k.bulgular.filter((b) => b !== 'site_yok');
        k.denetim = await siteyiDenetle(k.site);
        k.bulgular.push(...k.denetim.bulgular);
      } else {
        k.alanAdiBaskasinda = bulunan.alanAdi;
        k.bulgular.push('alan_adi_baskasinda');
      }
    });
    console.log('');
  }
}


// Hiz olcumu pahali (her biri 10-20sn), o yuzden sadece kisa listedeki
// ve sitesi erisilebilir olanlarda calistiriyoruz.
if (hizOlc) {
  const olculecek = kisaListe.filter((k) => k.denetim?.erisildi && k.denetim.sonUrl);
  console.log(`  [3/4] Mobil hız ölçülüyor (${olculecek.length} site, bu kısım yavaş)...`);

  let h = 0;
  await havuzda(olculecek, 4, async (k) => {
    k.hiz = await hiziOlc(k.denetim.sonUrl, apiKey);

    if (k.hiz) {
      if (k.hiz.skor < 50) k.bulgular.push('psi_yavas');
      else if (k.hiz.skor < 75) k.bulgular.push('psi_orta');

      // Yeni bulgu geldi, skoru tazele.
      k.zayiflik = zayiflikPuani(k.bulgular);
      k.firsat = firsatSkoru({ canlilik: k.canlilik, zayiflik: k.zayiflik });
      k.oncelik = oncelikEtiketi(k.firsat);
    }

    yaz(`\r        ${String(++h).padStart(4)}/${olculecek.length}   `);
  });

  kisaListe.sort((a, b) => b.firsat - a.firsat);
  console.log('\n');
} else {
  console.log('  [3/4] Hız ölçümü atlandı (--hiz-yok).\n');
}

// ---------------------------------------------------------------- 4. cikti

console.log('  [4/4] Raporlar yazılıyor...');

const raporDizin = resolve(ciktiDizin, 'raporlar');

if (existsSync(raporDizin)) rmSync(raporDizin, { recursive: true, force: true });
mkdirSync(raporDizin, { recursive: true });

// Ham veri: filtrelenmemis, tekillestirilmemis Places ciktisi.
// Bu dosya sayesinde filtre ve skor ayarlari --yeniden ile kota harcamadan
// tekrar tekrar denenebiliyor. Yeniden isleme modunda DOKUNULMUYOR.
if (!yenidenMod) {
  writeFileSync(resolve(ciktiDizin, 'ham.json'), JSON.stringify(hamKayitlar, null, 2), 'utf8');
}

// Denetim onbellegi — site icerigi ve hiz olcumleri.
writeFileSync(
  resolve(ciktiDizin, 'denetim.json'),
  JSON.stringify(
    Object.fromEntries(
      skorlanan.map((k) => [
        k.id,
        { site: k.site ?? null, bulgular: k.bulgular, denetim: k.denetim ?? null, hiz: k.hiz ?? null },
      ]),
    ),
    null,
    2,
  ),
  'utf8',
);

const sahip = {
  ad: process.env.SAHIP_ADI ?? '',
  unvan: process.env.SAHIP_UNVAN ?? '',
  telefon: process.env.SAHIP_TELEFON ?? '',
  eposta: process.env.SAHIP_EPOSTA ?? '',
  site: process.env.SAHIP_SITE ?? '',
  referansMetni: process.env.REFERANS_METNI ?? '',
  referansLink: process.env.REFERANS_LINK ?? '',
};

const kullanilanSluglar = new Set();
for (const k of kisaListe) {
  let slug = slugla(k.ad) || `isletme-${k.id.slice(0, 8)}`;
  while (kullanilanSluglar.has(slug)) slug = `${slug}-2`;
  kullanilanSluglar.add(slug);

  k.raporDosyasi = `${slug}.html`;
  writeFileSync(resolve(raporDizin, k.raporDosyasi), raporUret(k, sahip), 'utf8');
}

writeFileSync(resolve(ciktiDizin, 'prospects.csv'), csvUret(skorlanan), 'utf8');
writeFileSync(
  resolve(ciktiDizin, 'panel.html'),
  panelUret(kisaListe, { nisAdi: nis.ad, sehirler: sehirAdlari.join(', ') }),
  'utf8',
);

// Kanonik cikti — zincirin devami buradan besleniyor.
// isletme  : @studio/data semasi, demo ve gercek site bunu okuyor
// prospect : satis metadatasi, siteye gitmez
const taranmaTarihi = new Date().toISOString().slice(0, 10);
writeFileSync(
  resolve(ciktiDizin, 'isletmeler.json'),
  JSON.stringify(
    kisaListe.map((k) => ({
      isletme: prospecttenTaslak(k, { taranmaTarihi }),
      prospect: {
        firsat: k.firsat,
        oncelik: k.oncelik,
        canlilik: k.canlilik,
        zayiflik: k.zayiflik,
        bulgular: k.bulgular,
        mobilHiz: k.hiz?.skor ?? null,
        mevcutSite: k.site ?? null,
        raporDosyasi: k.raporDosyasi,
        // Fotograf REFERANSLARI — goruntuler demo asamasinda indiriliyor,
        // 983 isletmenin fotografini cekmenin anlami yok.
        fotoRefleri: k.fotograflar ?? [],
      },
    })),
    null,
    2,
  ),
  'utf8',
);

// ---------------------------------------------------------------- ozet

const sayim = (etiket) => skorlanan.filter((k) => k.oncelik === etiket).length;
const sitesizler = skorlanan.filter((k) => k.bulgular.includes('site_yok')).length;

// Fatura seffafligi: bu taramanin kac istek harcadigini ve aylik ucretsiz
// kotanin neresinde oldugunu goster.
const faturaSatiri = kuruMod
  ? '  API isteği        : 0 (kuru mod)'
  : [
      `  API isteği        : ${istekSayisi}`,
      `  Aylık ücretsiz    : ${AYLIK_UCRETSIZ_ISTEK} istek — bu tarama kotanın %${(
        (istekSayisi / AYLIK_UCRETSIZ_ISTEK) *
        100
      ).toFixed(0)}'i`,
      `  Kota aşılırsa     : ~$${((istekSayisi / 1000) * BIN_ISTEK_UCRETI_USD).toFixed(2)} tutarında`,
    ].join('\n');

console.log(`
  ────────────────────────────────────────────────
  ${skorlanan.length} işletme tarandı, ${kisaListe.length} tanesi için rapor üretildi.

${faturaSatiri}

  Çok yüksek öncelik : ${sayim('ÇOK YÜKSEK')}
  Yüksek öncelik     : ${sayim('YÜKSEK')}
  Orta               : ${sayim('ORTA')}
  Sitesi hiç olmayan : ${sitesizler}

  tools/prospect/out/${calismaAdi}/
    panel.html          ← buradan başla (İÇ KULLANIM, paylaşma)
    prospects.csv       ← tam liste
    raporlar/           ← gönderilecek raporlar
    isletmeler.json     ← kanonik veri, demo üreteci bunu okuyor
    ham.json            ← filtrelenmemiş ham veri (kaynak)
    denetim.json        ← site denetim önbelleği

  Önceki taramalar out/ altında duruyor, üzerine yazılmadı.

  Filtre veya skor ayarını değiştirdikten sonra — API kotası HARCAMADAN:
    npm run tara -- --nis=${nisAnahtar} --sehir=${sehirAdlari.join(',')} --yeniden=${calismaAdi}

  Sıradaki adım: panelin ilk 20 satırına elle demo hazırla.
  ────────────────────────────────────────────────
`);

const enIyi = kisaListe.slice(0, 10);
if (enIyi.length) {
  console.log('  İlk 10:\n');
  for (const [i, k] of enIyi.entries()) {
    const site = k.site ? '' : '  [SİTESİ YOK]';
    console.log(
      `  ${String(i + 1).padStart(2)}. ${String(k.firsat).padStart(3)} · ${k.ad.slice(0, 38).padEnd(38)} ${String(k.yorumSayisi).padStart(4)} yorum${site}`,
    );
  }
  console.log('');
}
