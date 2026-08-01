/**
 * YAYINA HAZIR MI? — yayın öncesi tek kapı.
 *
 *   npm run yayina-hazir
 *
 * İki denetimi sırayla koşar:
 *
 *   1. Sızıntı denetimi   — yayınlanacak dosyalarda gerçek veri var mı  (İÇERİK)
 *   2. Temiz klon testi   — doğru dosyalar mı gidiyor, gidenler yetiyor mu  (YAPI)
 *
 * ─────────────────────────────────────────────────────────────────────
 * NEDEN SIRALI, PARALEL DEĞİL
 *
 * Sızıntı denetimi saniyeler sürüyor, temiz klon testi ~85 saniye. Sızıntı
 * varsa klon testini koşmanın anlamı yok — o dosyalar zaten yayınlanmayacak.
 * Ucuz ve kesin olan önce.
 *
 * ─────────────────────────────────────────────────────────────────────
 * KISMİ DENETİM MESELESİ
 *
 * Sızıntı denetçisi yasaklı terimleri YEREL gerçek veriden türetiyor:
 * demo dosyaları, panel durumları, tarama çıktısı. Üçü de .gitignore'da,
 * yani CI'da HİÇBİRİ YOK. Orada denetçi yalnızca kalıp kurallarını
 * (telefon, e-posta, API anahtarı) koşabiliyor.
 *
 * Bu bir arıza değil, yapının sonucu. Ama gizlenirse tehlikeli: yeşil bir
 * CI rozetine bakıp "sızıntı taraması geçti" diye yayına çıkmak, taramanın
 * yarısının hiç koşmadığını bilmeden karar vermek olur.
 *
 * O yüzden denetçi kısmi koştuğunda 2 ile çıkıyor ve bu komut farkı
 * sonuç satırında AÇIKÇA yazıyor. CI yeşil kalıyor — kırmak yanlış olurdu,
 * o dosyalar oraya konamaz — ama "yayına hazır" demiyor.
 * ─────────────────────────────────────────────────────────────────────
 *
 * Çıkış kodu 0 = geçti (tam ya da kısmi), 1 = geçmedi.
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cizgi = '─'.repeat(58);

/** Alt denetimi çalıştırır; çıktısı doğrudan terminale akıyor. */
function kos(baslik, komut) {
  console.log(`\n  ${cizgi}\n  ${baslik}\n  ${cizgi}`);
  const { status } = spawnSync(komut, {
    cwd: kok,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, CI: process.env.CI ?? '' },
  });
  return status;
}

console.log('\n  YAYINA HAZIR MI?');

// ─────────────────────────────────────────────── 1. sızıntı denetimi

const sizinti = kos('1/2 · Sızıntı denetimi  (içerik)', 'node tools/denetim/sizinti.mjs');

if (sizinti === 1) {
  console.log(`
  ${cizgi}
  ✘ YAYINA HAZIR DEĞİL — sızıntı bulundu.

    Yukarıdaki bulguları temizlemeden devam etme. Temiz klon testi
    koşturulmadı; sızan dosyalarla yapı testinin anlamı yok.
  ${cizgi}
`);
  process.exit(1);
}

if (sizinti !== 0 && sizinti !== 2) {
  console.log(`\n  ✘ Sızıntı denetçisi beklenmeyen çıkış kodu verdi: ${sizinti}\n`);
  process.exit(1);
}

const kismi = sizinti === 2;

// ─────────────────────────────────────────────── 2. temiz klon testi

const klon = kos('2/2 · Temiz klon testi  (yapı)', 'node tools/denetim/temiz-clone.mjs');

if (klon !== 0) {
  console.log(`
  ${cizgi}
  ✘ YAYINA HAZIR DEĞİL — temiz klon testi geçmedi.

    Sızıntı yok ama klonlayan biri kuramıyor ya da hassas bir yol
    yayınlanacak listede. Sebep yukarıda.
  ${cizgi}
`);
  process.exit(1);
}

// ─────────────────────────────────────────────── sonuç

if (kismi) {
  console.log(`
  ${cizgi}
  ⚠ YAPI HAZIR — İÇERİK DENETİMİ YARIM KALDI

    Temiz klon testi geçti: doğru dosyalar gidiyor ve klonlayan biri
    sıfırdan kurup derleyebiliyor.

    Ama sızıntı denetimi KISMİ koştu — yerel gerçek veri bulunamadı,
    yani gerçek işletme adları ve alan adları hiç karşılaştırılmadı.
    Bu ortamda tam denetim MÜMKÜN DEĞİL; o dosyalar tanım gereği burada yok.

    Yayın kararı için: gerçek verinin durduğu makinede \`npm run yayina-hazir\`
    en az bir kez TAM modda yeşil vermeli. Bu çıktı onun yerine geçmez.
  ${cizgi}
`);
  process.exit(0);
}

console.log(`
  ${cizgi}
  ✔ YAYINA HAZIR

    İçerik : yayınlanacak dosyalarda gerçek veri yok (tam denetim).
    Yapı   : hassas yolların hiçbiri listede değil; temiz klon
             sıfırdan kuruluyor ve derleniyor.
  ${cizgi}
`);
process.exit(0);
