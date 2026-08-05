/**
 * BİÇİM DENETÇİSİ — karşılığı olmayan sınıf adı ve token kullanımı arar.
 *
 *   node tools/denetim/bicim.mjs
 *
 * ─────────────────────────────────────────────────────────────────────
 * NEDEN VAR
 *
 * Var olmayan bir CSS sınıfı HİÇBİR YERDE hata vermiyor. Derleme
 * geçiyor, tip denetimi geçiyor, sayfa açılıyor — sadece biçim
 * uygulanmıyor. Aynı şey `var(--olmayan-token)` için de geçerli:
 * tarayıcı bildirimi yutuyor ve öğe varsayılan görünümüyle kalıyor.
 *
 * Bu üç kez üst üste yaşandı:
 *
 *   --marka-cizgi   uydurulmuş token; dil değiştiricinin çerçevesi
 *                   hiç çizilmedi
 *   .sss-oge        uydurulmuş sınıf; İngilizce SSS biçimsiz çıktı
 *   .adim-no        uydurulmuş sınıf; ÜSTELİK grid'i bozdu — metin
 *                   3,5 rem'lik numara sütununa sıkışıp alt alta yığıldı
 *
 * İlk ikisi göz taramasıyla yakalandı, üçüncüsünü kullanıcı bildirdi.
 * Yani "dikkatli okumak" burada işe yarayan bir denetim değil: hata
 * sessiz, tekrarlıyor ve ancak sayfaya bakınca görülüyor.
 *
 * Ayrıca ilk koşusunda beklenmedik bir şey buldu: `.bildirim-iyi`
 * sınıfı işaretlemede kullanılıyordu ama CSS'te hiç tanımlı değildi.
 * Ekranda bozukluk yoktu (görünüm temel sınıftan geliyordu), o yüzden
 * aylarca fark edilmemişti.
 *
 * ─────────────────────────────────────────────────────────────────────
 * NE YAKALAR, NE YAKALAMAZ
 *
 * YAKALAR   : className içindeki düz metin sınıf adları, var(--token)
 *             kullanımları — hem .tsx dosyalarında hem CSS'in kendisinde
 * YAKALAMAZ : çalışma anında kurulan sınıf adları
 *             (`className={\`kart-\${tur}\`}` gibi). Bu bilinçli — öyle
 *             bir adı statik olarak çözmek için kodu çalıştırmak gerekir.
 *
 * Yani araç "hiç uydurma yok" demiyor, "uydurulmuş SABİT ad yok" diyor.
 * Bugüne kadarki üç hatanın üçü de sabit addı.
 *
 * ÇIKIŞ KODLARI
 *   0  karşılığı olmayan ad yok
 *   1  var
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * next/font tarafından üretilen değişkenler.
 *
 * Bunlar CSS'te tanımlı DEĞİL ve olmamalı da: `next/font` çağrısındaki
 * `variable: '--font-baslik'` seçeneği onları çalışma anında <html>
 * sınıfına basıyor. Kaynağını okumadan bakan bir denetçi üçünü de
 * "karşılığı yok" diye işaretliyor — üç kalıcı yanlış alarm, ve yanlış
 * alarm veren denetçi bir süre sonra okunmuyor.
 *
 * Bu yüzden tanımları .ts/.tsx içindeki `variable:` alanlarından da
 * topluyoruz; elle liste tutmak yerine kaynağı okuyoruz ki yeni bir
 * font eklendiğinde denetçi kendiliğinden öğrensin.
 */
const FONT_DEGISKENI = /variable:\s*['"](--[\w-]+)['"]/g;

function dosyalariTopla(dizin, uzantilar, biriktir = []) {
  if (!existsSync(dizin)) return biriktir;
  for (const ad of readdirSync(dizin)) {
    if (ad === 'node_modules' || ad === '.next' || ad === '.git') continue;
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) dosyalariTopla(yol, uzantilar, biriktir);
    else if (uzantilar.some((u) => ad.endsWith(u))) biriktir.push(yol);
  }
  return biriktir;
}

/** Bir uygulamanın kendi CSS'i + paylaşılan token kaynakları. */
function tanimlar(uygulamaDizini) {
  const siniflar = new Set();
  const tokenlar = new Set();

  const cssler = dosyalariTopla(join(uygulamaDizini, 'src'), ['.css']);
  for (const y of cssler) {
    const css = readFileSync(y, 'utf8');
    for (const m of css.matchAll(/\.([a-zA-Z][\w-]*)/g)) siniflar.add(m[1]);
    for (const m of css.matchAll(/(--[\w-]+)\s*:/g)) tokenlar.add(m[1]);
  }

  // Marka token'ları @studio/ui'dan geliyor, uygulamanın CSS'inde değil.
  const ui = join(kok, 'packages', 'ui', 'src');
  for (const y of dosyalariTopla(ui, ['.ts'])) {
    for (const m of readFileSync(y, 'utf8').matchAll(/(--[\w-]+)/g)) tokenlar.add(m[1]);
  }

  // next/font değişkenleri — uygulamanın kendi kaynağından.
  for (const y of dosyalariTopla(join(uygulamaDizini, 'src'), ['.ts', '.tsx'])) {
    for (const m of readFileSync(y, 'utf8').matchAll(FONT_DEGISKENI)) tokenlar.add(m[1]);
  }

  return { siniflar, tokenlar, cssler };
}

/**
 * className={...} içindeki SABİT sınıf adları.
 *
 * Hem `className="a b"` hem `className={...}` biçimini karşılıyor;
 * ikincisinde süslü parantezin içindeki bütün tırnaklı metinleri
 * topluyor, böylece üçlü koşul (`kosul ? 'a' : 'b'`) ve şablon dizesi
 * de kapsama giriyor. `${...}` ile kurulan parçalar atılıyor — onlar
 * çalışma anında belli oluyor.
 */
function siniflariCikar(kaynak) {
  const bulunan = [];

  for (const m of kaynak.matchAll(/className=(?:"([^"]*)"|\{([\s\S]*?)\})/g)) {
    if (m[1] !== undefined) {
      bulunan.push(...m[1].split(/\s+/));
      continue;
    }
    const ifade = (m[2] ?? '').replace(/\$\{[^}]*\}/g, ' ');
    for (const t of ifade.matchAll(/['"`]([^'"`]*)['"`]/g)) {
      bulunan.push(...t[1].split(/\s+/));
    }
  }

  // Sınıf adı olamayacakları ele: boşluk, değişken adı kalıntısı vs.
  return bulunan.filter((s) => s && /^[a-zA-Z][\w-]*$/.test(s));
}

// ─────────────────────────────────────────────────────────── koşu

const uygulamalar = readdirSync(join(kok, 'apps'))
  .map((ad) => join(kok, 'apps', ad))
  .filter((y) => statSync(y).isDirectory() && dosyalariTopla(join(y, 'src'), ['.css']).length);

if (!uygulamalar.length) {
  console.log('\n  Taranacak uygulama bulunamadı (src altında .css yok).\n');
  process.exit(0);
}

const bulgular = [];
let taranan = 0;

for (const uygulama of uygulamalar) {
  const { siniflar, tokenlar, cssler } = tanimlar(uygulama);
  const kaynaklar = dosyalariTopla(join(uygulama, 'src'), ['.tsx']);
  taranan += kaynaklar.length;

  for (const yol of kaynaklar) {
    const kaynak = readFileSync(yol, 'utf8');
    const kisa = relative(kok, yol).replace(/\\/g, '/');

    for (const s of new Set(siniflariCikar(kaynak))) {
      if (!siniflar.has(s)) bulgular.push({ kisa, tur: 'sınıf', ad: '.' + s });
    }
    for (const m of kaynak.matchAll(/var\((--[\w-]+)\)/g)) {
      if (!tokenlar.has(m[1])) bulgular.push({ kisa, tur: 'token', ad: m[1] });
    }
  }

  // CSS'in kendi var() kullanımları da denetleniyor: `--marka-cizgi`
  // hatası tam olarak burada doğmuştu, .tsx'te değil.
  for (const yol of cssler) {
    const kisa = relative(kok, yol).replace(/\\/g, '/');
    for (const m of readFileSync(yol, 'utf8').matchAll(/var\((--[\w-]+)/g)) {
      if (!tokenlar.has(m[1])) bulgular.push({ kisa, tur: 'token', ad: m[1] });
    }
  }
}

const benzersiz = [...new Map(bulgular.map((b) => [`${b.kisa}|${b.ad}`, b])).values()];

console.log(`
  Uygulama       : ${uygulamalar.length}
  Taranan dosya  : ${taranan} (.tsx) + ${uygulamalar.length} stil dosyası
`);

if (!benzersiz.length) {
  console.log('  ✔ Karşılığı olmayan sınıf ya da token yok.\n');
  process.exit(0);
}

console.log(`  ✘ ${benzersiz.length} KARŞILIĞI OLMAYAN AD:\n`);
for (const b of benzersiz) {
  console.log(`     ${b.tur.padEnd(6)} ${b.ad.padEnd(24)} ${b.kisa}`);
}
console.log(`
    Bu adlar hiçbir yerde tanımlı değil, yani hiçbir şey yapmıyorlar.
    Ya CSS'e ekle ya işaretlemeden çıkar.

    Çalışma anında kurulan bir ad ise (nadir) denetçi onu göremez —
    o durumda adı sabit hale getirmek daha iyi.
`);
process.exit(1);
