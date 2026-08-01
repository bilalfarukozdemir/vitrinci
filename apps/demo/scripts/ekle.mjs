/**
 * Tarama ciktisindan demo iskeleti uretir.
 *
 *   node apps/demo/scripts/ekle.mjs <tarama-klasoru> <slug|isim-parcasi> [...]
 *   node apps/demo/scripts/ekle.mjs 2026-07-30-insaat-duzce --ilk=5
 *
 * NE YAPAR (hepsi dogrulanabilir veri):
 *   - iletisim, adres, puan, yorum sayisi          → Maps
 *   - Google'daki gercek yorumlarin METNI          → Maps
 *   - isletmenin kendi fotograflari                → indirilir
 *   - palet, SEO, sema, sayfa iskeleti             → sablon
 *
 * NE YAPMAZ:
 *   - hizmet UYDURMAZ. `hizmetler` bos gelir.
 *
 * Sebep: bir onceki surum arama terimine bakip hizmet yaziyordu ve
 * "bahce duzenleme" aramasinda cikan bir bahce MOBILYASI magazasina
 * "cim seriyoruz" dedirtti. Baskasinin isi hakkinda iddia uretmek,
 * otomatiklestirilmemesi gereken tek sey.
 *
 * Sen ne yapacaksin: asagida basilan yorumlari oku, isin ne oldugunu anla,
 * hizmetleri yaz. 5-10 dakika.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { trNormalize } from '@studio/data';
import { prospecttenTaslak } from '@studio/data/adapters/prospect';

import { sablonSec, NOTR_MARKA, NOTR_MARKA_KOYU } from '../src/sablonlar.ts';
import { siteAra } from '../../../tools/prospect/src/alanadi.mjs';
import { kayitDefteriYaz } from './kayit-defteri.mjs';

const uygulamaKok = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoKok = resolve(uygulamaKok, '..', '..');
const veriDizin = resolve(uygulamaKok, 'src', 'veriler');
const fotoKok = resolve(uygulamaKok, 'public', 'foto');

// ---------------------------------------------------------------- argümanlar

const argv = process.argv.slice(2);
const bayraklar = argv.filter((a) => a.startsWith('--'));
const konumsal = argv.filter((a) => !a.startsWith('--'));

const taramaKlasoru = konumsal[0];
const ilkKac = Number((bayraklar.find((b) => b.startsWith('--ilk=')) ?? '').split('=')[1] ?? 0);
const fotografsiz = bayraklar.includes('--fotografsiz');

const taramaKok = resolve(repoKok, 'tools', 'prospect', 'out');

const listele = () =>
  existsSync(taramaKok)
    ? readdirSync(taramaKok, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => `    ${d.name}`)
        .join('\n')
    : '    (yok — önce bir tarama çalıştır)';

if (!taramaKlasoru) {
  console.error(`
  Kullanım:
    node apps/demo/scripts/ekle.mjs <tarama-klasörü> <slug> [slug...]
    node apps/demo/scripts/ekle.mjs <tarama-klasörü> --ilk=5
    ... --fotografsiz    fotoğraf indirmeyi atla

  Mevcut tarama klasörleri:
${listele()}
`);
  process.exit(1);
}

const kaynakYol = resolve(taramaKok, taramaKlasoru, 'isletmeler.json');
if (!existsSync(kaynakYol)) {
  console.error(`\n  ${kaynakYol} bulunamadı.\n\n  Mevcut klasörler:\n${listele()}\n`);
  process.exit(1);
}

const kayitlar = JSON.parse(readFileSync(kaynakYol, 'utf8'));

/**
 * RAPORDA YOKSA HAM VERIYE DUS.
 *
 * isletmeler.json taramanin RAPORLANMIS kismi — nis ve sehir filtresinden
 * gecmis, --limit kadar kayit. Ham havuzda olup raporda olmayan isletmeler
 * var ve bazilari iyi prospect cikiyor:
 *
 *   Bir koltuk doseme atolyesi → turu `furniture_store`, insaat nisinde yok
 *   Bir cati ustasi            → adresi taranan sehirlerin disinda kaliyor
 *
 * Bu noktada insan zaten "bunu istiyorum" demis oluyor. Filtrenin isi
 * SIRALAMA yapmak, secimi ENGELLEMEK degil. Ham kaydi kanonik semaya
 * cevirip devam ediyoruz — fotograf referanslarinin sekli zaten ayni.
 */
function hamdanBul(istenen) {
  const hamYol = resolve(taramaKok, taramaKlasoru, 'ham.json');
  if (!existsSync(hamYol)) return null;

  const aranan = trNormalize(istenen);
  const h = JSON.parse(readFileSync(hamYol, 'utf8')).find((k) => trNormalize(k.ad ?? '').includes(aranan));
  if (!h) return null;

  return {
    isletme: prospecttenTaslak(h, { taranmaTarihi: taramaKlasoru.slice(0, 10) }),
    prospect: { fotoRefleri: h.fotograflar ?? [], firsat: null, oncelik: 'ham' },
  };
}

const secilenler = ilkKac
  ? kayitlar.slice(0, ilkKac)
  : konumsal
      .slice(1)
      .map((istenen) => {
        const aranan = trNormalize(istenen);
        const bulunan = kayitlar.find(
          (k) => k.isletme.slug === istenen || trNormalize(k.isletme.ad).includes(aranan),
        );
        if (bulunan) return bulunan;

        const hamdan = hamdanBul(istenen);
        if (hamdan) {
          console.log(`  ℹ "${istenen}" raporda yok, ham veriden alındı (niş/şehir filtresi dışında).`);
          return hamdan;
        }
        console.error(`  ! "${istenen}" bu taramada hiç bulunamadı, atlanıyor.`);
        return null;
      })
      .filter(Boolean);

if (!secilenler.length) {
  console.error('\n  Seçilen kayıt yok.\n');
  process.exit(1);
}

// ---------------------------------------------------------------- fotoğraflar

/** tools/prospect/.env icindeki anahtari okur (sadece bu deger). */
function apiAnahtari() {
  const yol = resolve(repoKok, 'tools', 'prospect', '.env');
  if (!existsSync(yol)) return null;
  const satir = readFileSync(yol, 'utf8')
    .split(/\r?\n/)
    .find((s) => s.trim().startsWith('GOOGLE_API_KEY='));
  const deger = satir?.slice(satir.indexOf('=') + 1).trim();
  return deger || null;
}

/**
 * Isletmenin Google fotograflarini indirir.
 *
 * Maliyet: Place Photo SKU, ~$7/1000 istek. 5 fotograf = ~0.035$.
 *
 * ONEMLI — bunlar DEMO ASAMASI varliklari:
 * Google Maps Platform sartlari, cekilen icerigin uzun sureli saklanmasini
 * sinirliyor (~30 gun). Satis kapandiginda musterinin kendi fotograflariyla
 * degistirilecek — ki zaten kalite acisindan da dogrusu o.
 * Kullanilmayan demoların klasorunu silmeyi aliskanlik edin.
 */
/**
 * Gorselin genislik/yuksekligini okur — JPEG ve PNG.
 *
 * NEDEN GEREKLI: Google fotograflarinin cogu telefonla cekilmis, yani
 * DIKEY. Genis bir hero'da dikey fotografin ortasi kirpiliyor ve orasi
 * genelde gokyuzu oluyor — bir hafriyatcida 6 fotografin 5'i dikeydi.
 * Olculeri bilirsek kapak icin en YATAY olani secebiliyoruz.
 *
 * Ayrica <img> etiketine genislik/yukseklik yazilinca tarayici yeri
 * onceden ayiriyor, sayfa yuklenirken zipliyor.
 */
function gorselOlcu(veri) {
  // PNG: Google, uzantisi .jpg olsa bile PNG donebiliyor. Bir konak
  // demosunun EN IYI fotografi boyleydi; sadece JPEG okuyan surum onu
  // olcemedi ve kapak secimi disinda kaldi.
  if (veri.length > 24 && veri.readUInt32BE(0) === 0x89504e47) {
    return { genislik: veri.readUInt32BE(16), yukseklik: veri.readUInt32BE(20) };
  }

  if (veri.readUInt16BE(0) !== 0xffd8) return {}; // SOI degil, JPEG de degil

  let i = 2;
  while (i < veri.length - 9) {
    // Isaretler arasinda dolgu olarak 0xFF tekrarlanabiliyor.
    if (veri[i] !== 0xff) { i++; continue; }
    while (veri[i] === 0xff) i++;
    const isaret = veri[i];
    i++;

    // Uzunluk tasimayan tekil isaretler: RSTn (D0-D7), SOI, EOI, TEM.
    if ((isaret >= 0xd0 && isaret <= 0xd9) || isaret === 0x01) continue;

    // SOS'tan sonrasi sikistirilmis veri; orada 0xFF baytlari isaret DEGIL.
    // Onceki surum burada devam edip cop uzunluk okuyordu ve olcuyu
    // 56045x10877 gibi imkansiz degerlere goturuyordu.
    if (isaret === 0xda) break;

    const uzunluk = veri.readUInt16BE(i);

    // SOF0-SOF15 cerceve basliklari; DHT(C4)/JPG(C8)/DAC(CC) haric.
    if (isaret >= 0xc0 && isaret <= 0xcf && isaret !== 0xc4 && isaret !== 0xc8 && isaret !== 0xcc) {
      return { yukseklik: veri.readUInt16BE(i + 3), genislik: veri.readUInt16BE(i + 5) };
    }

    if (uzunluk < 2) break; // bozuk
    i += uzunluk;
  }
  return {};
}

async function fotograflariIndir(slug, referanslar, anahtar) {
  if (!anahtar || !referanslar?.length) return [];

  const hedef = resolve(fotoKok, slug);
  if (existsSync(hedef)) rmSync(hedef, { recursive: true, force: true });
  mkdirSync(hedef, { recursive: true });

  const sonuc = [];

  for (const [i, ref] of referanslar.slice(0, 6).entries()) {
    try {
      const adres =
        `https://places.googleapis.com/v1/${ref.ad}/media` +
        `?maxHeightPx=1200&skipHttpRedirect=true&key=${anahtar}`;

      const yanit = await fetch(adres, { signal: AbortSignal.timeout(20000) });
      if (!yanit.ok) continue;

      const { photoUri } = await yanit.json();
      if (!photoUri) continue;

      const gorsel = await fetch(photoUri, { signal: AbortSignal.timeout(30000) });
      if (!gorsel.ok) continue;

      const dosya = `${i + 1}.jpg`;
      const veri = Buffer.from(await gorsel.arrayBuffer());
      writeFileSync(resolve(hedef, dosya), veri);
      sonuc.push({ url: `/foto/${slug}/${dosya}`, katki: ref.katki ?? null, ...gorselOlcu(veri) });
    } catch {
      // Tek fotograf basarisiz olursa demo yine de uretilsin.
    }
  }

  return sonuc;
}

// ---------------------------------------------------------------- üretim

mkdirSync(veriDizin, { recursive: true });
const anahtar = fotografsiz ? null : apiAnahtari();

if (!fotografsiz && !anahtar) {
  console.log('  ! GOOGLE_API_KEY bulunamadı, fotoğraflar atlanıyor.\n');
}

const gir = (deger) => JSON.stringify(deger, null, 2).split('\n').join('\n  ');
const ozet = [];

/**
 * Demo adresine tahmin edilemez bir ek koyar: /vadi-yapi-k3f9ap
 *
 * NEDEN: slug isletme adinin kendisi, yani tahmin edilebilir. Prospect'e
 * "kimseye gondermedim, sadece siz gorun diye" diyorsun; adresten firma
 * adini degistirip komsu firmayi bulan biri bu cumleyi curutur.
 *
 * Kok dizin uretimde zaten 404 (bkz. src/app/page.tsx) — bu ek, listeyi
 * gormeden tek tek tahmin etme yolunu da kapatiyor.
 */
const jeton = () => Math.random().toString(36).slice(2, 8);

for (const kayit of secilenler) {
  const { isletme, prospect } = kayit;
  const { sablon, gerekce } = sablonSec(isletme.googleTurleri, isletme.sektor);

  const fotograflar = await fotograflariIndir(isletme.slug, prospect.fotoRefleri, anahtar);

  const marka = sablon?.marka ?? NOTR_MARKA;
  const markaKoyu = sablon?.markaKoyu ?? NOTR_MARKA_KOYU;

  const taslak = {
    ...isletme,
    // Ozet de bir iddia — sablon varsa notr bir cumle, yoksa hic.
    ozet: isletme.ozet,
    slogan: sablon?.vaat,

    // BOS. Yorumlari okuyup sen dolduracaksin.
    hizmetler: [],

    // SSS sablondan gelebilir; bunlar hizmet iddiasi degil, calisma sekli.
    // Yine de gozden gecir — "ücretsiz keşif" yapmiyor olabilirler.
    sss: sablon?.sss ?? [],

    // KAPAK = en YATAY fotograf, ilki degil. Hero tam genislikte
    // bastigi icin dikey bir kare orta bandindan kirpiliyor ve genelde
    // gokyuzu kaliyor. Olcu okunamazsa ilk fotografa dusuyor.
    galeri: (() => {
      const oran = (f) => (f.genislik && f.yukseklik ? f.genislik / f.yukseklik : 0);
      const enYatay = fotograflar.reduce(
        (iyi, f) => (oran(f) > oran(iyi) ? f : iyi),
        fotograflar[0],
      );
      return fotograflar.map((f, i) => ({
        url: f.url,
        alt: `${isletme.ad} — iş fotoğrafı ${i + 1}`,
        ...(f.genislik ? { genislik: f.genislik, yukseklik: f.yukseklik } : {}),
        oneCikan: f === enYatay,
      }));
    })(),

    marka,
    seo: { ...isletme.seo, indekslenebilir: false },
    kaynak: { ...isletme.kaynak, musteriOnayli: false },
  };

  const yorumlar = isletme.referanslar ?? [];

  const dosya = `/**
 * ${isletme.ad}
 *
 * Kaynak   : ${taramaKlasoru}
 * Kategori : ${isletme.sektor ?? '—'}
 * Şablon   : ${sablon ? sablon.ad : 'YOK'} (${gerekce})
 * Fırsat   : ${prospect.firsat} · ${prospect.oncelik}
 *
 * ─────────────────────────────────────────────────────────────────────
 * GÖNDERMEDEN ÖNCE DOLDUR
 *
 *   1. hizmetler — ŞU AN BOŞ. Aşağıdaki Google yorumlarını oku, gerçekten
 *      ne iş yaptıklarını anla, öyle yaz. Tahmin etme.
 *   2. ozet — işletmeyi bir cümlede anlat, kendi dillerine yakın olsun.
 *   3. sss — şablondan geldi, doğru olduğundan emin ol.
 *   4. galeri — ${fotograflar.length} fotoğraf Google'dan indirildi. Alakasız
 *      olanları çıkar.
 *
 * Bittiğinde kaynak.musteriOnayli = true yap. O ana kadar sayfa görünür
 * bir "taslak" şeridi taşıyor ve arama motorlarına kapalı.
 *
 * GOOGLE YORUMLARI (işin ne olduğunu bunlar söylüyor):
${
  yorumlar.length
    ? yorumlar
        .map((y) => {
          const yildiz = y.puan ? '★'.repeat(Math.round(y.puan)).padEnd(5, '·') : '·····';
          const uyari = (y.puan ?? 5) <= 2 ? '  ⚠ OLUMSUZ' : '';
          return ` *   ${yildiz} ${y.yazar}: ${y.metin.replace(/\s+/g, ' ').slice(0, 170)}${uyari}`;
        })
        .join('\n')
    : ' *   (yorum metni yok)'
}
${
  yorumlar.some((y) => (y.puan ?? 5) <= 2)
    ? ' *\n *   ⚠ Olumsuz yorum var. Demoda gösterilmiyor (4 yıldız altı filtreleniyor)\n *     ama satış görüşmesinde karşına çıkabilir — okumuş ol.\n'
    : ''
}${
  sablon
    ? ` *
 * "${sablon.ad}" ŞABLONUNDA TİPİK HİZMETLER — sadece ÖNERİ, doğru olanı sen seç:
${sablon.hizmetOnerileri.map((h) => ` *   • ${h.ad} — ${h.ozet}`).join('\n')}
`
    : ''
} * ─────────────────────────────────────────────────────────────────────
 */
import { isletmeTaslakSemasi } from '@studio/data';

import type { Demo } from '@/tipler';

const demo: Demo = {
  vaat: ${JSON.stringify(sablon?.vaat ?? '')},${sablon?.basliklar ? `
  basliklar: ${JSON.stringify(sablon.basliklar)},` : ''}
  marka: ${gir(marka)},
  markaKoyu: ${gir(markaKoyu)},
  isletme: isletmeTaslakSemasi.parse(${gir(taslak)}),
};

export default demo;
`;

  // Dosya adi = kayit anahtari = URL yolu. isletme.slug temiz kaliyor.
  const yol = `${isletme.slug}-${jeton()}`;
  writeFileSync(resolve(veriDizin, `${yol}.ts`), dosya, 'utf8');

  ozet.push({
    ad: isletme.ad,
    slug: yol,
    sablon: sablon ? sablon.ad : '—',
    gerekce,
    foto: fotograflar.length,
    yorum: yorumlar.length,
    telefon: isletme.iletisim?.telefon,
    sehir: isletme.adresler?.[0]?.il,
  });
}

// ---------------------------------------------------------------- site var mı
//
// Google'in `websiteUri` alani bos olmasi "sitesi yok" demek DEGIL,
// "Google bilmiyor" demek. Bir prospect'e mesaj gonderildikten SONRA
// adinin harfi harfine .com.tr olarak kayitli oldugu ortaya cikti. Bu
// kontrol tam olarak onu yakalar; artik gonderilmeden once calisiyor.

const siteBulgulari = new Map();
for (const o of ozet) {
  try {
    const s = await siteAra(o.ad, o.telefon, { sehir: o.sehir });
    if (s) siteBulgulari.set(o.slug, s);
  } catch {
    /* ag hatasi demo uretimini durdurmasin */
  }
}

// ---------------------------------------------------------------- kayıt defteri

const dosyalar = kayitDefteriYaz(veriDizin);

// ---------------------------------------------------------------- özet

console.log('');
for (const o of ozet) {
  console.log(`  ${o.ad.slice(0, 30).padEnd(31)} ${o.sablon.padEnd(18)} ${String(o.foto).padStart(2)} foto  ${String(o.yorum).padStart(2)} yorum`);
  console.log(`  ${''.padEnd(31)} └ ${o.gerekce}`);
  console.log(`  ${''.padEnd(31)} → /${o.slug}`);
}

const sablonsuz = ozet.filter((o) => o.sablon === '—');
if (sablonsuz.length) {
  console.log(`\n  ${sablonsuz.length} işletme için şablon SEÇİLMEDİ — kategori tanınmadı veya perakende.`);
  console.log('  Bu dosyalarda hizmetler ve SSS boş; tamamını sen yazacaksın.');
}

if (siteBulgulari.size) {
  console.log('\n  ⚠ SİTE BULUNDU — mesaj göndermeden önce bak:');
  for (const [slug, s] of siteBulgulari) {
    const o = ozet.find((x) => x.slug === slug);
    console.log(`    ${o.ad.slice(0, 28).padEnd(30)} ${s.alanAdi}`);
    console.log(
      `    ${''.padEnd(30)} ${
        { kesin: '✓ KESİN — telefon sayfada eşleşti',
          guclu: '● GÜÇLÜ — sayfada şehri geçiyor, muhtemelen onların',
          zayif: '? ZAYIF — muhtemelen aynı isimli başka firma' }[s.guven]
      }`,
    );
    if (s.baslik) console.log(`    ${''.padEnd(30)} "${s.baslik}"`);
  }
  console.log('    Google bunları bilmiyor olabilir; "siteniz yok" demeden önce aç bak.');
}

console.log(`\n  Kayıt defteri: ${dosyalar.length} demo`);
console.log('\n  Sıradaki adım: dosyaları aç, yorumları oku, hizmetleri yaz.');
console.log(`  Önizleme: npm run dev --workspace=@studio/demo → localhost:3001/${ozet[0]?.slug ?? ''}\n`);
