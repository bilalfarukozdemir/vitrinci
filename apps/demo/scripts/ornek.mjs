/**
 * Ornek demo fiksturlerini calisir hale getirir.
 *
 *   npm run ornek
 *
 * `src/veriler.ornek/` → `src/veriler/` kopyalar, sonra kayit defterini
 * yeniden yazar.
 *
 * ─────────────────────────────────────────────────────────────────────
 * NEDEN BOYLE BIR ADIM VAR
 *
 * `src/veriler/` .gitignore'da: icinde ucuncu kisilerin adi, telefonu,
 * adresi ve Google yorumlari (yazar adiyla birlikte) var. Yani TEMIZ BIR
 * KLONDA O KLASOR HIC YOK ve `next build` "@/veriler bulunamadi" diye
 * patlar. Bu komut, klonlayan kisinin calistirabilecegi en kucuk adim:
 *
 *   npm install → npm run ornek → npm run build
 *
 * ─────────────────────────────────────────────────────────────────────
 * VAR OLANIN UZERINE YAZMAZ
 *
 * Ayni adi tasiyan bir dosya varsa atlanir. Sebep: ornekleri kopyalayip
 * kendi isine gore duzenlemek beklenen kullanim; ikinci kez `npm run
 * ornek` calistiran biri kendi emegini kaybetmemeli.
 *
 * Kayit defteri (`index.ts`) ise HER ZAMAN yeniden yaziliyor, cunku o
 * uretilen bir dosya ve dizinin gercek icerigini yansitmak zorunda.
 * "Uzerine yazma" kurali ona uygulansaydi, yeni kopyalanan ornekler
 * deftere hic girmez ve sessizce gorunmez olurdu.
 * ─────────────────────────────────────────────────────────────────────
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { kayitDefteriYaz } from './kayit-defteri.mjs';

const uygulamaKok = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const kaynakDizin = resolve(uygulamaKok, 'src', 'veriler.ornek');
const veriDizin = resolve(uygulamaKok, 'src', 'veriler');

if (!existsSync(kaynakDizin)) {
  console.error(`\n  Örnek fikstür klasörü yok: ${kaynakDizin}\n`);
  process.exit(1);
}

mkdirSync(veriDizin, { recursive: true });

const ornekler = readdirSync(kaynakDizin)
  .filter((d) => d.endsWith('.ts') && d !== 'index.ts')
  .sort();

if (!ornekler.length) {
  console.error('\n  veriler.ornek/ içinde demo dosyası bulunamadı.\n');
  process.exit(1);
}

console.log('');
let kopyalanan = 0;

for (const ad of ornekler) {
  const hedef = resolve(veriDizin, ad);
  if (existsSync(hedef)) {
    console.log(`  ─ ${ad.padEnd(34)} zaten var, dokunulmadı`);
    continue;
  }
  copyFileSync(resolve(kaynakDizin, ad), hedef);
  console.log(`  ✓ ${ad.padEnd(34)} kopyalandı`);
  kopyalanan++;
}

const defter = kayitDefteriYaz(veriDizin);

console.log(`\n  Kayıt defteri: ${defter.length} demo (${kopyalanan} yeni)`);
console.log(`
  Sıradaki adım:

    npm run build --workspace=@studio/demo
    npm run dev  --workspace=@studio/demo    → http://localhost:3001
`);
